/**
 * Utilities to help testing components that depend on API status
 */
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { vi } from 'vitest';

const API_STATUS_URL = 'http://localhost:3000/api/dashboard/status';

/**
 * Setup API status testing environment
 * @returns {Object} Testing utilities for API status
 */
export function setupApiStatusTest() {
  // Create a new instance of axios mock adapter
  const mock = new MockAdapter(axios);
  
  // Setup fake timers
  vi.useFakeTimers();
  
  // Function to mock a successful API response with specific latency
  const mockSuccessfulResponse = (latencyMs = 50) => {
    vi.spyOn(Date, 'now')
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce(1000 + latencyMs);
    
    mock.onGet(API_STATUS_URL).reply(200, { status: 'ok' });
  };
  
  // Function to mock a degraded API response (high latency)
  const mockDegradedResponse = (latencyMs = 350) => {
    vi.spyOn(Date, 'now')
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce(1000 + latencyMs);
    
    mock.onGet(API_STATUS_URL).reply(200, { status: 'ok' });
  };
  
  // Function to mock a server error
  const mockServerError = () => {
    mock.onGet(API_STATUS_URL).reply(500);
  };
  
  // Function to mock a network error
  const mockNetworkError = () => {
    mock.onGet(API_STATUS_URL).networkError();
  };
  
  // Function to mock a timeout
  const mockTimeout = () => {
    mock.onGet(API_STATUS_URL).timeout();
  };
  
  // Function to clean up all mocks
  const cleanup = () => {
    mock.reset();
    vi.restoreAllMocks();
    vi.useRealTimers();
  };
  
  return {
    mock,
    mockSuccessfulResponse,
    mockDegradedResponse,
    mockServerError,
    mockNetworkError,
    mockTimeout,
    cleanup
  };
}
