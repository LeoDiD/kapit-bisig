/**
 * Face Recognition Service using face-api.js
 * Handles face detection, face matching, and descriptor generation
 */

import * as faceapi from 'face-api.js';
import { Canvas, Image, ImageData } from 'canvas';
import * as path from 'path';
import * as fs from 'fs';

// Patch face-api.js to use node-canvas
// @ts-ignore
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

// Configuration
const FACE_MATCH_THRESHOLD = 0.6; // Lower distance = more similar (0.6 is recommended)
const MIN_FACE_CONFIDENCE = 0.5;
const MODELS_PATH = path.join(__dirname, '../models/face-api');

export interface FaceDetectionResult {
  hasFace: boolean;
  faceCount: number;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  landmarks: {
    leftEye: { x: number; y: number };
    rightEye: { x: number; y: number };
    nose: { x: number; y: number };
    leftMouth: { x: number; y: number };
    rightMouth: { x: number; y: number };
  } | null;
  qualityScore: number;
  issues: string[];
}

export interface FaceCompareResult {
  isMatch: boolean;
  distance: number;
  similarity: number;
  confidence: number;
  threshold: number;
}

export interface FaceDescriptorData {
  descriptor: number[];
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

class FaceRecognitionService {
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize face-api.js models
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._loadModels();
    await this.initPromise;
  }

  private async _loadModels(): Promise<void> {
    try {
      console.log('[FaceRecognition] Loading face-api.js models...');

      // Create models directory if it doesn't exist
      if (!fs.existsSync(MODELS_PATH)) {
        fs.mkdirSync(MODELS_PATH, { recursive: true });
        console.log('[FaceRecognition] Models directory created at:', MODELS_PATH);
        console.log('[FaceRecognition] Please download models from https://github.com/justadudewhohacks/face-api.js/tree/master/weights');
        throw new Error('Face-api models not found. Please download them first.');
      }

      // Load required models
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromDisk(MODELS_PATH),
        faceapi.nets.faceLandmark68Net.loadFromDisk(MODELS_PATH),
        faceapi.nets.faceRecognitionNet.loadFromDisk(MODELS_PATH),
      ]);

      this.isInitialized = true;
      console.log('[FaceRecognition] Models loaded successfully');
    } catch (error) {
      console.error('[FaceRecognition] Failed to load models:', error);
      throw error;
    }
  }

  /**
   * Load image from base64 string
   */
  private async loadImage(base64Image: string): Promise<Image> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      
      // Handle both with and without data URI prefix
      if (base64Image.startsWith('data:image')) {
        img.src = base64Image;
      } else {
        img.src = `data:image/jpeg;base64,${base64Image}`;
      }
    });
  }

  /**
   * Detect face in an image
   */
  async detectFace(base64Image: string): Promise<FaceDetectionResult> {
    await this.initialize();

    const issues: string[] = [];

    try {
      const img = await this.loadImage(base64Image);
      
      // Detect all faces with landmarks
      const detections = await faceapi
        .detectAllFaces(img as any)
        .withFaceLandmarks();

      if (detections.length === 0) {
        return {
          hasFace: false,
          faceCount: 0,
          confidence: 0,
          boundingBox: null,
          landmarks: null,
          qualityScore: 0,
          issues: ['No face detected in the image'],
        };
      }

      // Get the first (largest) face
      const detection = detections[0];
      const box = detection.detection.box;
      const landmarks = detection.landmarks;

      // Check confidence
      if (detection.detection.score < MIN_FACE_CONFIDENCE) {
        issues.push('Face detection confidence is low');
      }

      // Check face size relative to image
      const faceRatio = (box.width * box.height) / (img.width * img.height);
      if (faceRatio < 0.05) {
        issues.push('Face is too small in the image');
      } else if (faceRatio > 0.7) {
        issues.push('Face is too close to the camera');
      }

      // Check if face is centered
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;
      const imageCenterX = img.width / 2;
      const imageCenterY = img.height / 2;
      
      if (Math.abs(centerX - imageCenterX) > img.width * 0.3) {
        issues.push('Face is not centered horizontally');
      }

      // Extract landmark points
      const leftEye = landmarks.getLeftEye()[0];
      const rightEye = landmarks.getRightEye()[0];
      const nose = landmarks.getNose()[0];
      const mouth = landmarks.getMouth();

      // Calculate quality score based on detection confidence and issues
      const qualityScore = Math.max(0, detection.detection.score - (issues.length * 0.1));

      return {
        hasFace: true,
        faceCount: detections.length,
        confidence: detection.detection.score,
        boundingBox: {
          x: Math.round(box.x),
          y: Math.round(box.y),
          width: Math.round(box.width),
          height: Math.round(box.height),
        },
        landmarks: {
          leftEye: { x: Math.round(leftEye.x), y: Math.round(leftEye.y) },
          rightEye: { x: Math.round(rightEye.x), y: Math.round(rightEye.y) },
          nose: { x: Math.round(nose.x), y: Math.round(nose.y) },
          leftMouth: { x: Math.round(mouth[0].x), y: Math.round(mouth[0].y) },
          rightMouth: { x: Math.round(mouth[6].x), y: Math.round(mouth[6].y) },
        },
        qualityScore,
        issues,
      };
    } catch (error) {
      console.error('[FaceRecognition] Detection error:', error);
      return {
        hasFace: false,
        faceCount: 0,
        confidence: 0,
        boundingBox: null,
        landmarks: null,
        qualityScore: 0,
        issues: ['Failed to process image: ' + (error as Error).message],
      };
    }
  }

  /**
   * Compare two faces
   */
  async compareFaces(base64Image1: string, base64Image2: string): Promise<FaceCompareResult> {
    await this.initialize();

    try {
      const [img1, img2] = await Promise.all([
        this.loadImage(base64Image1),
        this.loadImage(base64Image2),
      ]);

      // Detect faces and get descriptors
      const [detection1, detection2] = await Promise.all([
        faceapi.detectSingleFace(img1 as any).withFaceLandmarks().withFaceDescriptor(),
        faceapi.detectSingleFace(img2 as any).withFaceLandmarks().withFaceDescriptor(),
      ]);

      if (!detection1 || !detection2) {
        return {
          isMatch: false,
          distance: 1,
          similarity: 0,
          confidence: 0,
          threshold: FACE_MATCH_THRESHOLD,
        };
      }

      // Calculate Euclidean distance between face descriptors
      const distance = faceapi.euclideanDistance(
        detection1.descriptor,
        detection2.descriptor
      );

      // Convert distance to similarity (0-1 scale, higher is better)
      const similarity = Math.max(0, 1 - distance);
      
      // Calculate confidence based on both detection scores
      const confidence = (detection1.detection.score + detection2.detection.score) / 2;

      return {
        isMatch: distance < FACE_MATCH_THRESHOLD,
        distance: Math.round(distance * 1000) / 1000,
        similarity: Math.round(similarity * 1000) / 1000,
        confidence: Math.round(confidence * 1000) / 1000,
        threshold: FACE_MATCH_THRESHOLD,
      };
    } catch (error) {
      console.error('[FaceRecognition] Comparison error:', error);
      return {
        isMatch: false,
        distance: 1,
        similarity: 0,
        confidence: 0,
        threshold: FACE_MATCH_THRESHOLD,
      };
    }
  }

  /**
   * Generate face descriptor for storage
   */
  async generateDescriptor(base64Image: string): Promise<FaceDescriptorData | null> {
    await this.initialize();

    try {
      const img = await this.loadImage(base64Image);

      const detection = await faceapi
        .detectSingleFace(img as any)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        return null;
      }

      const box = detection.detection.box;

      return {
        descriptor: Array.from(detection.descriptor),
        boundingBox: {
          x: Math.round(box.x),
          y: Math.round(box.y),
          width: Math.round(box.width),
          height: Math.round(box.height),
        },
      };
    } catch (error) {
      console.error('[FaceRecognition] Descriptor generation error:', error);
      return null;
    }
  }

  /**
   * Compare face with stored descriptor
   */
  async compareWithDescriptor(
    base64Image: string,
    storedDescriptor: number[]
  ): Promise<FaceCompareResult> {
    await this.initialize();

    try {
      const img = await this.loadImage(base64Image);

      const detection = await faceapi
        .detectSingleFace(img as any)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        return {
          isMatch: false,
          distance: 1,
          similarity: 0,
          confidence: 0,
          threshold: FACE_MATCH_THRESHOLD,
        };
      }

      // Calculate distance between descriptors
      const distance = faceapi.euclideanDistance(
        detection.descriptor,
        new Float32Array(storedDescriptor)
      );

      const similarity = Math.max(0, 1 - distance);

      return {
        isMatch: distance < FACE_MATCH_THRESHOLD,
        distance: Math.round(distance * 1000) / 1000,
        similarity: Math.round(similarity * 1000) / 1000,
        confidence: Math.round(detection.detection.score * 1000) / 1000,
        threshold: FACE_MATCH_THRESHOLD,
      };
    } catch (error) {
      console.error('[FaceRecognition] Comparison error:', error);
      return {
        isMatch: false,
        distance: 1,
        similarity: 0,
        confidence: 0,
        threshold: FACE_MATCH_THRESHOLD,
      };
    }
  }
}

// Export singleton instance
export const faceRecognitionService = new FaceRecognitionService();
