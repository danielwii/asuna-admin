import getConfig from 'next/config';

/**
 * 调试模式，生产中也可以激活
 */
export const isDebugMode = (global as any).DEBUG_MODE;

/**
 * 开发模式，生产中无法激活
 */
export const isDevMode = (global as any).DEBUG_MODE || getConfig().publicRuntimeConfig?.env !== 'production';
