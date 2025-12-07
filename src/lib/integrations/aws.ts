// =====================================
// FLUX - AWS Integration Connector
// Last Updated: 02:45:00 Dec 07, 2025
// =====================================

import type {
  AWSCredentials,
  AWSInstance,
  AWSMetricDatapoint,
  AWSHealthStatus,
  SyncResult,
} from './types';

/**
 * AWS service regions
 */
export type AWSRegion =
  | 'us-east-1'
  | 'us-east-2'
  | 'us-west-1'
  | 'us-west-2'
  | 'eu-west-1'
  | 'eu-west-2'
  | 'eu-central-1'
  | 'ap-northeast-1'
  | 'ap-southeast-1'
  | 'ap-southeast-2';

/**
 * CloudWatch metric request
 */
export interface CloudWatchMetricRequest {
  namespace: string;
  metricName: string;
  dimensions?: { name: string; value: string }[];
  startTime: Date;
  endTime: Date;
  period?: number;
  statistic?: 'Average' | 'Sum' | 'Minimum' | 'Maximum' | 'SampleCount';
}

/**
 * RDS instance info
 */
export interface RDSInstance {
  identifier: string;
  engine: string;
  engineVersion: string;
  status: string;
  endpoint?: string;
  port?: number;
  allocatedStorage: number;
  instanceClass: string;
}

/**
 * Lambda function info
 */
export interface LambdaFunction {
  name: string;
  runtime: string;
  handler: string;
  codeSize: number;
  memorySize: number;
  timeout: number;
  lastModified: string;
  state: string;
}

/**
 * AWS request signer (Signature Version 4)
 * Simplified implementation - in production, use @aws-sdk
 */
class AWSSigner {
  private accessKeyId: string;
  private secretAccessKey: string;
  private region: string;
  private service: string;

  constructor(credentials: AWSCredentials, service: string) {
    this.accessKeyId = credentials.accessKeyId;
    this.secretAccessKey = credentials.secretAccessKey;
    this.region = credentials.region;
    this.service = service;
  }

  /**
   * Sign a request with AWS Signature Version 4
   * Note: This is a simplified placeholder. Real implementation needs crypto
   */
  async signRequest(
    method: string,
    url: string,
    headers: Record<string, string>,
    body?: string
  ): Promise<Record<string, string>> {
    const date = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = date.slice(0, 8);

    // In a real implementation, this would:
    // 1. Create canonical request
    // 2. Create string to sign
    // 3. Calculate signature using HMAC-SHA256
    // 4. Add Authorization header

    return {
      ...headers,
      'X-Amz-Date': date,
      'X-Amz-Content-Sha256': 'UNSIGNED-PAYLOAD',
      'Authorization': `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${dateStamp}/${this.region}/${this.service}/aws4_request, SignedHeaders=host;x-amz-date, Signature=placeholder`,
    };
  }
}

/**
 * AWS Integration Connector
 * Handles API interactions with AWS services
 */
export class AWSConnector {
  private credentials: AWSCredentials;

  constructor(credentials: AWSCredentials) {
    this.credentials = credentials;
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  private getEndpoint(service: string): string {
    return `https://${service}.${this.credentials.region}.amazonaws.com`;
  }

  private async makeRequest<T>(
    service: string,
    action: string,
    params: Record<string, string | string[]> = {},
    version = '2016-11-15'
  ): Promise<T> {
    const endpoint = this.getEndpoint(service);
    const signer = new AWSSigner(this.credentials, service);

    // Build query string
    const queryParams = new URLSearchParams();
    queryParams.set('Action', action);
    queryParams.set('Version', version);

    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v, i) => {
          queryParams.set(`${key}.${i + 1}`, v);
        });
      } else {
        queryParams.set(key, value);
      }
    });

    const url = `${endpoint}/?${queryParams.toString()}`;

    const headers = await signer.signRequest('GET', url, {
      'Host': new URL(endpoint).host,
      'Content-Type': 'application/x-www-form-urlencoded',
    });

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`AWS ${service} error: ${response.status} - ${text}`);
    }

    const text = await response.text();
    // Parse XML response (simplified - real implementation would use XML parser)
    return this.parseXMLResponse<T>(text);
  }

  /**
   * Simple XML to object parser
   * Note: In production, use a proper XML parser
   */
  private parseXMLResponse<T>(xml: string): T {
    // This is a very simplified parser for demo purposes
    // Real implementation should use xml2js or similar
    const result: Record<string, unknown> = {};

    // Extract common patterns
    const extractValue = (tag: string): string | undefined => {
      const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
      return match ? match[1] : undefined;
    };

    const extractAll = (tag: string): string[] => {
      const matches = xml.matchAll(new RegExp(`<${tag}>([^<]*)</${tag}>`, 'g'));
      return Array.from(matches).map((m) => m[1]);
    };

    result.raw = xml;
    result.extractValue = extractValue;
    result.extractAll = extractAll;

    return result as T;
  }

  // ============================================
  // EC2 Methods
  // ============================================

  /**
   * List EC2 instances
   */
  async listInstances(instanceIds?: string[]): Promise<AWSInstance[]> {
    const params: Record<string, string | string[]> = {};
    if (instanceIds?.length) {
      params['InstanceId'] = instanceIds;
    }

    try {
      const response = await this.makeRequest<{
        raw: string;
        extractValue: (tag: string) => string | undefined;
        extractAll: (tag: string) => string[];
      }>('ec2', 'DescribeInstances', params);

      // Parse instances from response (simplified)
      const instanceIdList = response.extractAll('instanceId');
      const stateList = response.extractAll('name'); // instance state name
      const typeList = response.extractAll('instanceType');

      return instanceIdList.map((id, index) => ({
        instanceId: id,
        instanceType: typeList[index] || 'unknown',
        state: (stateList[index] as AWSInstance['state']) || 'pending',
        launchTime: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('EC2 DescribeInstances error:', error);
      return [];
    }
  }

  /**
   * Get instance status
   */
  async getInstanceStatus(instanceIds: string[]): Promise<{
    instanceId: string;
    instanceStatus: string;
    systemStatus: string;
  }[]> {
    try {
      const response = await this.makeRequest<{
        extractAll: (tag: string) => string[];
      }>('ec2', 'DescribeInstanceStatus', {
        'InstanceId': instanceIds,
        'IncludeAllInstances': 'true',
      });

      const ids = response.extractAll('instanceId');
      const instanceStatuses = response.extractAll('instanceStatus');
      const systemStatuses = response.extractAll('systemStatus');

      return ids.map((id, index) => ({
        instanceId: id,
        instanceStatus: instanceStatuses[index] || 'unknown',
        systemStatus: systemStatuses[index] || 'unknown',
      }));
    } catch (error) {
      console.error('EC2 DescribeInstanceStatus error:', error);
      return [];
    }
  }

  // ============================================
  // CloudWatch Methods
  // ============================================

  /**
   * Get metric data
   */
  async getMetricData(request: CloudWatchMetricRequest): Promise<AWSMetricDatapoint[]> {
    try {
      const params: Record<string, string> = {
        'Namespace': request.namespace,
        'MetricName': request.metricName,
        'StartTime': request.startTime.toISOString(),
        'EndTime': request.endTime.toISOString(),
        'Period': String(request.period || 300),
        'Statistics.member.1': request.statistic || 'Average',
      };

      if (request.dimensions) {
        request.dimensions.forEach((dim, index) => {
          params[`Dimensions.member.${index + 1}.Name`] = dim.name;
          params[`Dimensions.member.${index + 1}.Value`] = dim.value;
        });
      }

      const response = await this.makeRequest<{
        extractAll: (tag: string) => string[];
      }>('monitoring', 'GetMetricStatistics', params, '2010-08-01');

      const timestamps = response.extractAll('Timestamp');
      const values = response.extractAll('Average');
      const units = response.extractAll('Unit');

      return timestamps.map((ts, index) => ({
        timestamp: new Date(ts),
        value: parseFloat(values[index]) || 0,
        unit: units[index] || 'None',
      }));
    } catch (error) {
      console.error('CloudWatch GetMetricStatistics error:', error);
      return [];
    }
  }

  /**
   * Get CPU utilization for an instance
   */
  async getCPUUtilization(
    instanceId: string,
    hours = 1
  ): Promise<AWSMetricDatapoint[]> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);

    return this.getMetricData({
      namespace: 'AWS/EC2',
      metricName: 'CPUUtilization',
      dimensions: [{ name: 'InstanceId', value: instanceId }],
      startTime,
      endTime,
      period: 300,
      statistic: 'Average',
    });
  }

  /**
   * Get network metrics for an instance
   */
  async getNetworkMetrics(
    instanceId: string,
    hours = 1
  ): Promise<{
    networkIn: AWSMetricDatapoint[];
    networkOut: AWSMetricDatapoint[];
  }> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);

    const [networkIn, networkOut] = await Promise.all([
      this.getMetricData({
        namespace: 'AWS/EC2',
        metricName: 'NetworkIn',
        dimensions: [{ name: 'InstanceId', value: instanceId }],
        startTime,
        endTime,
        period: 300,
        statistic: 'Average',
      }),
      this.getMetricData({
        namespace: 'AWS/EC2',
        metricName: 'NetworkOut',
        dimensions: [{ name: 'InstanceId', value: instanceId }],
        startTime,
        endTime,
        period: 300,
        statistic: 'Average',
      }),
    ]);

    return { networkIn, networkOut };
  }

  // ============================================
  // RDS Methods
  // ============================================

  /**
   * List RDS instances
   */
  async listRDSInstances(): Promise<RDSInstance[]> {
    try {
      const response = await this.makeRequest<{
        extractAll: (tag: string) => string[];
      }>('rds', 'DescribeDBInstances', {}, '2014-10-31');

      const identifiers = response.extractAll('DBInstanceIdentifier');
      const engines = response.extractAll('Engine');
      const statuses = response.extractAll('DBInstanceStatus');
      const classes = response.extractAll('DBInstanceClass');

      return identifiers.map((id, index) => ({
        identifier: id,
        engine: engines[index] || 'unknown',
        engineVersion: '',
        status: statuses[index] || 'unknown',
        allocatedStorage: 0,
        instanceClass: classes[index] || 'unknown',
      }));
    } catch (error) {
      console.error('RDS DescribeDBInstances error:', error);
      return [];
    }
  }

  // ============================================
  // Lambda Methods
  // ============================================

  /**
   * List Lambda functions
   */
  async listLambdaFunctions(): Promise<LambdaFunction[]> {
    try {
      // Lambda uses JSON REST API, not the query API
      const endpoint = `https://lambda.${this.credentials.region}.amazonaws.com/2015-03-31/functions`;

      const signer = new AWSSigner(this.credentials, 'lambda');
      const headers = await signer.signRequest('GET', endpoint, {
        Host: new URL(endpoint).host,
      });

      const response = await fetch(endpoint, { headers });

      if (!response.ok) {
        throw new Error(`Lambda error: ${response.status}`);
      }

      const data = await response.json();
      const functions = data.Functions || [];

      return functions.map((fn: any) => ({
        name: fn.FunctionName,
        runtime: fn.Runtime || 'unknown',
        handler: fn.Handler || 'unknown',
        codeSize: fn.CodeSize || 0,
        memorySize: fn.MemorySize || 128,
        timeout: fn.Timeout || 3,
        lastModified: fn.LastModified || '',
        state: fn.State || 'Active',
      }));
    } catch (error) {
      console.error('Lambda ListFunctions error:', error);
      return [];
    }
  }

  // ============================================
  // Flux Integration Methods
  // ============================================

  /**
   * Get overall AWS health status
   */
  async getHealthStatus(): Promise<AWSHealthStatus> {
    try {
      const [instances, rdsInstances, lambdaFunctions] = await Promise.all([
        this.listInstances(),
        this.listRDSInstances(),
        this.listLambdaFunctions(),
      ]);

      const runningEC2 = instances.filter((i) => i.state === 'running').length;
      const availableRDS = rdsInstances.filter((i) => i.status === 'available').length;

      return {
        ec2: {
          running: runningEC2,
          total: instances.length,
          healthy: runningEC2 === instances.length || instances.length === 0,
        },
        rds: {
          available: availableRDS,
          total: rdsInstances.length,
        },
        lambda: {
          functions: lambdaFunctions.length,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('AWS health check error:', error);
      return {
        ec2: { running: 0, total: 0, healthy: false },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get resource summary for Flux dashboard
   */
  async getResourceSummary(): Promise<{
    ec2: {
      running: number;
      stopped: number;
      total: number;
      types: Record<string, number>;
    };
    rds: {
      available: number;
      total: number;
      engines: Record<string, number>;
    };
    lambda: {
      count: number;
      runtimes: Record<string, number>;
    };
  }> {
    const [instances, rdsInstances, lambdaFunctions] = await Promise.all([
      this.listInstances(),
      this.listRDSInstances(),
      this.listLambdaFunctions(),
    ]);

    // Count instance types
    const ec2Types: Record<string, number> = {};
    instances.forEach((i) => {
      ec2Types[i.instanceType] = (ec2Types[i.instanceType] || 0) + 1;
    });

    // Count RDS engines
    const rdsEngines: Record<string, number> = {};
    rdsInstances.forEach((i) => {
      rdsEngines[i.engine] = (rdsEngines[i.engine] || 0) + 1;
    });

    // Count Lambda runtimes
    const lambdaRuntimes: Record<string, number> = {};
    lambdaFunctions.forEach((fn) => {
      lambdaRuntimes[fn.runtime] = (lambdaRuntimes[fn.runtime] || 0) + 1;
    });

    return {
      ec2: {
        running: instances.filter((i) => i.state === 'running').length,
        stopped: instances.filter((i) => i.state === 'stopped').length,
        total: instances.length,
        types: ec2Types,
      },
      rds: {
        available: rdsInstances.filter((i) => i.status === 'available').length,
        total: rdsInstances.length,
        engines: rdsEngines,
      },
      lambda: {
        count: lambdaFunctions.length,
        runtimes: lambdaRuntimes,
      },
    };
  }

  /**
   * Sync AWS resources to Flux
   */
  async syncToFlux(): Promise<SyncResult> {
    const errors: string[] = [];
    let itemsSynced = 0;

    try {
      const health = await this.getHealthStatus();

      itemsSynced =
        health.ec2.total + (health.rds?.total || 0) + (health.lambda?.functions || 0);

      return {
        success: true,
        provider: 'aws',
        itemsSynced,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return {
        success: false,
        provider: 'aws',
        itemsSynced: 0,
        errors: [`AWS sync failed: ${err}`],
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Test AWS credentials
   */
  async testCredentials(): Promise<{
    valid: boolean;
    error?: string;
    accountId?: string;
  }> {
    try {
      // Try to get caller identity
      const response = await this.makeRequest<{
        extractValue: (tag: string) => string | undefined;
      }>('sts', 'GetCallerIdentity', {}, '2011-06-15');

      const accountId = response.extractValue('Account');

      return {
        valid: true,
        accountId,
      };
    } catch (error) {
      return {
        valid: false,
        error: String(error),
      };
    }
  }
}

// 02:45:00 Dec 07, 2025

