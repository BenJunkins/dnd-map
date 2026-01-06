// smooth region boundaries
import fs from 'fs';
import { bakeCurves } from './bake_lines.js';

//exclude .json file type it is included in next step
const fileName = 'regions';

const inputFile = `./src/${fileName}.json`;
const outputFile = `./src/${fileName}_smooth.json`;

console.log(`Resource: Loading regions from ${inputFile}...`);

try {
    const rawData = fs.readFileSync(inputFile, 'utf8');
    const sourceData = JSON.parse(rawData);

    const finalData = bakeCurves(sourceData, { 
        resolution: 10000, 
        sharpness: 0.85 
    });

    fs.writeFileSync(outputFile, JSON.stringify(finalData, null, 2));
    console.log(`Success! Smoothed data saved to ${outputFile}`);
    
} catch (error) {
    console.error("Error processing regions:", error.message);
}
