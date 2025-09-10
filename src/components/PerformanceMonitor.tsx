import React, { useState, useEffect, useCallback } from 'react';
import { PerformanceService } from '../services/PerformanceService';

interface PerformanceMonitorProps {
  isVisible?: boolean;
  onToggle?: (visible: boolean) => void;
}

interface PerformanceMetrics {
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  cacheStats: {
    imageCache: number;
  };
  lastOperationTime?: number;
  operationHistory: Array<{
    name: string;
    duration: number;
    timestamp: number;
  }>;
}

/**
 * PerformanceMonitor component provides real-time performance metrics
 * and optimization controls for the PDF Document Generator
 */
export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  isVisible = false,
  onToggle
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    memoryUsage: { used: 0, total: 0, percentage: 0 },
    cacheStats: { imageCache: 0 },
    operationHistory: []
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [performanceService] = useState(() => PerformanceService.getInstance());

  // Update metrics periodically
  useEffect(() => {
    if (!isVisible) return;

    const updateMetrics = () => {
      const memoryUsage = performanceService.monitorMemoryUsage();
      const cacheStats = performanceService.getCacheStats();

      setMetrics(prev => ({
        ...prev,
        memoryUsage,
        cacheStats
      }));
    };

    // Initial update
    updateMetrics();

    // Update every 2 seconds when visible
    const interval = setInterval(updateMetrics, 2000);

    return () => clearInterval(interval);
  }, [isVisible, performanceService]);

  const handleClearCaches = useCallback(() => {
    performanceService.clearCaches();
    
    // Update metrics immediately
    const cacheStats = performanceService.getCacheStats();
    setMetrics(prev => ({
      ...prev,
      cacheStats
    }));
  }, [performanceService]);

  const handleToggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getMemoryStatusColor = (percentage: number): string => {
    if (percentage > 80) return 'text-red-600 bg-red-50';
    if (percentage > 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => onToggle?.(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
        title="Show Performance Monitor"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-80">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-sm font-semibold text-gray-800">Performance Monitor</h3>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={handleToggleExpanded}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            onClick={() => onToggle?.(false)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Hide Performance Monitor"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">
        {/* Memory Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">Memory Usage</span>
            <span className={`text-xs px-2 py-1 rounded-full ${getMemoryStatusColor(metrics.memoryUsage.percentage)}`}>
              {metrics.memoryUsage.percentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                metrics.memoryUsage.percentage > 80 ? 'bg-red-500' :
                metrics.memoryUsage.percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(metrics.memoryUsage.percentage, 100)}%` }}
            />
          </div>
          {metrics.memoryUsage.total > 0 && (
            <div className="text-xs text-gray-500">
              {formatBytes(metrics.memoryUsage.used)} / {formatBytes(metrics.memoryUsage.total)}
            </div>
          )}
        </div>

        {/* Cache Statistics */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">Cache Status</span>
            <button
              onClick={handleClearCaches}
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              Clear Caches
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Image Cache:</span>
              <span className="font-medium">{metrics.cacheStats.imageCache} items</span>
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <>
            {/* Performance Configuration */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <span className="text-xs font-medium text-gray-600">Configuration</span>
              <div className="grid grid-cols-1 gap-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Max Image Size:</span>
                  <span className="font-medium">{formatBytes(performanceService.getConfig().maxImageSize)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Max Dataset Size:</span>
                  <span className="font-medium">{performanceService.getConfig().maxDatasetSize} items</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">PDF Chunk Size:</span>
                  <span className="font-medium">{performanceService.getConfig().pdfChunkSize} items</span>
                </div>
              </div>
            </div>

            {/* Performance Tips */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <span className="text-xs font-medium text-gray-600">Performance Tips</span>
              <div className="space-y-1 text-xs text-gray-500">
                {metrics.memoryUsage.percentage > 80 && (
                  <div className="flex items-start space-x-1 text-red-600">
                    <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>High memory usage detected. Consider reducing dataset size.</span>
                  </div>
                )}
                {metrics.cacheStats.imageCache > 50 && (
                  <div className="flex items-start space-x-1 text-yellow-600">
                    <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>Large image cache. Consider clearing caches periodically.</span>
                  </div>
                )}
                {metrics.memoryUsage.percentage < 50 && metrics.cacheStats.imageCache < 20 && (
                  <div className="flex items-start space-x-1 text-green-600">
                    <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Performance is optimal.</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};