/**
 * Download face-api.js models
 * Run this script to download the required models for face recognition
 * 
 * Usage: npx ts-node scripts/downloadFaceModels.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { fileURLToPath } from 'url';

// ES Module compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODELS_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
const MODELS_DIR = path.join(__dirname, '../server/models/face-api');

const MODELS = [
  // SSD MobileNet v1 - Face Detection
  'ssd_mobilenetv1_model-weights_manifest.json',
  'ssd_mobilenetv1_model-shard1',
  'ssd_mobilenetv1_model-shard2',
  
  // Face Landmark 68 - Facial Landmarks Detection  
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  
  // Face Recognition - Face Descriptor Extraction
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2',
];

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirect
        https.get(response.headers.location!, (redirectResponse) => {
          redirectResponse.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        }).on('error', (err) => {
          fs.unlink(dest, () => {});
          reject(err);
        });
      } else if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      } else {
        reject(new Error(`Failed to download: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log('📦 Downloading face-api.js models...\n');
  
  // Create models directory
  if (!fs.existsSync(MODELS_DIR)) {
    fs.mkdirSync(MODELS_DIR, { recursive: true });
    console.log(`✅ Created directory: ${MODELS_DIR}\n`);
  }
  
  let downloaded = 0;
  let skipped = 0;
  
  for (const model of MODELS) {
    const url = `${MODELS_URL}/${model}`;
    const dest = path.join(MODELS_DIR, model);
    
    // Skip if already exists
    if (fs.existsSync(dest)) {
      console.log(`⏭️  Skipping (exists): ${model}`);
      skipped++;
      continue;
    }
    
    try {
      console.log(`⬇️  Downloading: ${model}`);
      await downloadFile(url, dest);
      console.log(`✅ Downloaded: ${model}`);
      downloaded++;
    } catch (error) {
      console.error(`❌ Failed to download ${model}:`, error);
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`   Downloaded: ${downloaded}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${MODELS.length}`);
  console.log(`\n✅ Models are ready in: ${MODELS_DIR}`);
}

main().catch(console.error);
