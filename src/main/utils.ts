import { AxiosError } from 'axios'

/**
 * Format an Axios error object.
 *
 * @param error - Error to format
 * @returns Formatted error
 */
export function formatAxiosError(error: AxiosError): string {
    return `${error.code}\n${error.message}\n${error.stack}`
}
