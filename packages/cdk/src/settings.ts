/**
 * サービス固有のマスター値
 */
export const SERVICE_NAME = 'mycms' as const

/**
 * AWS固有の環境変数
 */
const AWS_DEFAULT_REGION = 'ap-northeast-1'
export const AWS_REGION: string = process.env.AWS_REGION || AWS_DEFAULT_REGION

export const BACKEND_IMAGE_TAG = process.env.BACKEND_IMAGE_TAG
