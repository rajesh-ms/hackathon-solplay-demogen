// Jest setup for api-demogen
import 'jest';
import dotenv from 'dotenv';

// Load a safe test .env (falls back to root .env if present)
dotenv.config();

// Provide dummy API keys to satisfy service constructors
process.env.V0_API_KEY = process.env.V0_API_KEY || 'test-v0-key';
process.env.V0_BASE_URL = process.env.V0_BASE_URL || 'https://v0.dev/api';
process.env.AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || 'https://example-openai-endpoint.openai.azure.com';
process.env.AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-test';
process.env.AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview';
process.env.ENABLE_AI_CONTENT_ENHANCEMENT = 'false'; // disable actual calls during tests

// Silence winston console output during test runs except errors
jest.spyOn(console, 'info').mockImplementation(() => undefined);
jest.spyOn(console, 'warn').mockImplementation(() => undefined);
jest.spyOn(console, 'debug').mockImplementation(() => undefined);
