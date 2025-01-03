function adjustCityLayerSize() {
    const grid = document.querySelector('.grid');
    const cityLayer = document.querySelector('.city-layer');

    if (grid && cityLayer) {
        const width = Math.floor(grid.clientWidth);
        const height = Math.floor(grid.clientHeight);
        
        cityLayer.style.width = `${width}px`;
        cityLayer.style.height = `${height}px`;
        cityLayer.style.top = `0`;
        cityLayer.style.left = '0';
    }
}

function adjustGridSize() {
    grid = document.querySelector('.grid');
    const vh = window.innerHeight - document.querySelector('.navbar').offsetHeight;
    const vw = window.innerWidth;

    // Ensure integer square size
    let squareSize = Math.floor((vh - 65) / 8);
    
    // Set exact grid width and height
    grid.style.width = `${16 * squareSize}px`;
    grid.style.height = `${8 * squareSize}px`;

    adjustCityLayerSize();
}


function showTileSum(x, y) {
    const adjacentCoords = [
        { dx: 0, dy: 0 },  // Up
        { dx: -1, dy: 0 },  // Left
        { dx: 0, dy: -1 },   // Right
        { dx: -1, dy: -1 }    // Down
    ];

    let tileValues = {};
    let totalValue = 0;

    adjacentCoords.forEach(coord => {
        const adjX = x + coord.dx;
        const adjY = y + coord.dy;

        if (adjX >= 0 && adjX < 16 && adjY >= 0 && adjY < 8) {
            const tileIndex = adjY * 16 + adjX;

            if (tileIndex >= 0 && tileIndex < mapData.tiles.length) {
                const tileType = mapData.tiles[tileIndex].type;
                const terrain = terrainTypes.find(t => t.type === tileType);
                
                if (terrain) {
                    const value = terrain.value || 0;
                    totalValue += value;

                    if (tileValues[tileType]) {
                        tileValues[tileType].count++;
                        tileValues[tileType].value += value;
                    } else {
                        tileValues[tileType] = { count: 1, value: value };
                    }
                }
            }
        }
    });

    const existingTooltip = document.getElementById('tile-tooltip');
    if (existingTooltip) existingTooltip.remove();

    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.id = 'tile-tooltip';

    let tooltipContent = '';
    for (const [type, info] of Object.entries(tileValues)) {
        tooltipContent += `${type} (x${info.count}): ${info.value} pts<br>`;
    }
    tooltipContent += `<hr>Total: ${totalValue} pts`;

    tooltip.innerHTML = tooltipContent;

    const squareWidth = grid.clientWidth / 16;
    const squareHeight = grid.clientHeight / 8;

    const gridOffset = grid.getBoundingClientRect();
    const scale = grid.offsetWidth / grid.clientWidth;

    // Center tooltip over city and adjust to avoid blocking
    const offsetX = x * squareWidth * scale;
    const offsetY = y * squareHeight * scale;

    tooltip.style.left = `${gridOffset.left + offsetX - squareWidth * scale / 2 - 42}px`;
    tooltip.style.top = `${gridOffset.top + offsetY - squareHeight * scale / 2 - 42}px`; // Raise it slightly above the city

    tooltip.classList.add('show');
    document.body.appendChild(tooltip);
}





function hideTileSum() {
    const tooltip = document.getElementById('tile-tooltip');
    if (tooltip) tooltip.remove();
}


function countInfraIntersections(infraArray, infraType = 'waterway', xCoord, yCoord) {
    return infraArray.filter(infra =>
        infraType.includes(infra.type) &&
        ((infra.x1 === xCoord && infra.y1 === yCoord) || (infra.x2 === xCoord && infra.y2 === yCoord))
    ).length;
}



function isWaterAdjacent(x, y, mapData) {
    const width = mapData.dimensions.width;
    const height = mapData.dimensions.height;

    const neighbors = [];

    // Calculate the correct tile indices for neighbors
    if (y > 0) {
        neighbors.push({ index: (y) * width + x, direction: 'top', pos: [x, y] });
    }
    if (y < height - 1) {
        neighbors.push({ index: (y - 1) * width + (x - 1), direction: 'bottom', pos: [x - 1, y - 1] });
    }
    if (x > 0) {
        neighbors.push({ index: y * width + (x - 1), direction: 'left', pos: [x - 1, y] });
    }
    if (x < width - 1) {
        neighbors.push({ index: (y - 1) * width + x, direction: 'right', pos: [x, y - 1] });
    }

    console.log(`Checking neighbors for point (${x}, ${y}):`);

    const waterDetected = neighbors.some(neighbor => {
        const tile = mapData.tiles[neighbor.index];
        console.log(`  - ${neighbor.direction}: Tile ${neighbor.index} at (${neighbor.pos[0]}, ${neighbor.pos[1]}) - ${tile?.type || 'undefined'}`);
        return tile && tile.type === 'water';
    });

    console.log(`Result: ${waterDetected ? 'Water detected' : 'No water detected'}\n`);
    return waterDetected;
}




function renderCities(mapData) {

    grid = document.getElementById('terrain-grid');
    const cityLayer = document.getElementById('city-layer');

    if (!cityLayer) {
        console.error('City layer not found. Skipping city rendering.');
        return;
    }

    cityLayer.innerHTML = '';

    const squareWidth = grid.clientWidth / 16;
    const squareHeight = grid.clientHeight / 8;

    if (!mapData.cities || mapData.cities.length === 0) return;

    mapData.cities.forEach(city => {
        const cityDiv = document.createElement('div');
        cityDiv.className = `city ${city.owner}`;
        cityDiv.style.left = `${(city.x * squareWidth)}px`;
        cityDiv.style.top = `${(city.y * squareHeight)}px`;
        cityDiv.style.transform = 'translate(-50%, -50%)';

        // Attach hover listener

        
        cityDiv.addEventListener('mouseenter', () => {
            console.log('City hovered:', city.x, city.y);
            showTileSum(city.x, city.y);
        });


        cityDiv.addEventListener('mouseleave', hideTileSum);

        cityLayer.appendChild(cityDiv);
    });

    adjustCityLayerSize();
}

function renderRoads(mapData) {
    const roadLayer = document.getElementById('road-layer') || document.createElement('div');
    roadLayer.id = 'road-layer';
    roadLayer.className = 'road-layer';
    const grid = document.getElementById('terrain-grid');
    roadLayer.style.position = 'absolute';
    roadLayer.style.top = '0';
    roadLayer.style.left = '0';
    roadLayer.style.width = `${grid.clientWidth}px`;
    roadLayer.style.height = `${grid.clientHeight}px`;

    grid.appendChild(roadLayer);
    roadLayer.innerHTML = '';  // Clear previous roads

    const squareWidth = grid.clientWidth / 16;
    const squareHeight = grid.clientHeight / 8;

    const junctionPoints = {};

    if (!mapData || !mapData.infra) return;

    // 1. Render Roads and Shores First
    mapData.infra.forEach(road => {
        const roadDiv = document.createElement('div');
        roadDiv.className = road.type === 'waterway' ? 'waterway' : (road.type === 'shore' ? 'shore' : 'road');

        const x1 = road.x1 * squareWidth;
        const y1 = road.y1 * squareHeight;
        const x2 = road.x2 * squareWidth;
        const y2 = road.y2 * squareHeight;

        const deltaX = x2 - x1;
        const deltaY = y2 - y1;

        const roadWidth = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

        roadDiv.style.width = `${roadWidth}px`;
        roadDiv.style.height = '8px';
        roadDiv.style.position = 'absolute';
        roadDiv.style.left = `${x1}px`;
        roadDiv.style.top = `${y1}px`;
        roadDiv.style.transform = `rotate(${angle}deg)`;
        roadDiv.style.transformOrigin = 'top left';

        roadLayer.appendChild(roadDiv);

        // Track the junction point and its type
        const key1 = `${road.x1}-${road.y1}`;
        const key2 = `${road.x2}-${road.y2}`;

        if (!junctionPoints[key1]) junctionPoints[key1] = { count: 0, types: new Set() };
        if (!junctionPoints[key2]) junctionPoints[key2] = { count: 0, types: new Set() };

        junctionPoints[key1].count += 1;
        junctionPoints[key2].count += 1;

        junctionPoints[key1].types.add(road.type);
        junctionPoints[key2].types.add(road.type);
    });

    for (const key in junctionPoints) {
        const [x, y] = key.split('-').map(Number);
        const junction = document.createElement('div');

        if (junctionPoints[key].count > 1) {
            // Determine junction type based on intersecting infra
            if (junctionPoints[key].types.has('road') && junctionPoints[key].types.has('shore')) {
                junction.className = 'gravel-junction';
            } else if (junctionPoints[key].types.has('waterway') && junctionPoints[key].types.has('road')) {
                junction.className = 'bridge-junction';
            } else if (junctionPoints[key].types.has('shore')) {
                if (countInfraIntersections(mapData.infra, 'shore', x, y) === 2) {
                    junction.className = 'shore-end';
                }else{
                    junction.className = 'shore-junction';
                }
            } else if (junctionPoints[key].types.has('road')) {
                if (countInfraIntersections(mapData.infra, 'road', x, y) === 2) {
                    junction.className = 'road-end';
                }else{
                    junction.className = 'road-junction';
                }
            } else if(junctionPoints[key].types.has('waterway')){
                if (x === 0 || x === 16 || y === 0 || y === 8){
                    if(y === 0 && x === 0){
                        junction.className = 'waterway-end top left';
                    }else if(y === 0){
                        junction.className = 'waterway-end top';
                    }else if(y === 8){
                        junction.className = 'waterway-end bottom';
                    }else if(x === 0){
                        junction.className = 'waterway-end left';
                    }else if(x === 16){
                        junction.className = 'waterway-end right';
                    }
                }else{
                    if (countInfraIntersections(mapData.infra, 'waterway', x, y) === 4) {
                        junction.className = 'waterway-junction';
                    } else if (countInfraIntersections(mapData.infra, 'waterway', x, y) <= 2) {
                        // Check for bay or lake
                        const isWaterTile = isWaterAdjacent(x, y, mapData);
                        junction.className = isWaterTile ? 'bay' : 'lake';
                    }else{
                        junction.className = 'waterway-junction-bg';
                    }
                }
            } else {
                junction.className = 'no-junction';
            }
        }

        // Place junction at the tile intersection
        junction.style.left = `${x * squareWidth}px`;
        junction.style.top = `${y * squareHeight}px`;
        roadLayer.appendChild(junction);
    }


}





