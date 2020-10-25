import Axios, { AxiosError, CancelToken } from 'axios'
import Dns from 'dns'
import electronLog from 'electron-log'
import Url from 'url'
import { promisify } from 'util'

import { RequestError } from './errors'
import { formatAxiosError } from './utils'

const asyncLookup = promisify(Dns.lookup)
const log = electronLog.scope('dns-handler')

/**
 * Resolve the IP of a request URL by sending a HEAD request to each A record,
 * using the first IP to respond.
 *
 * @param requestUrl - URL being requested
 * @param cancelToken - Cancel token to stop DNS probes
 * @returns Resolved IP address
 */
export async function resolveDns(requestUrl: Url.URL, cancelToken?: CancelToken): Promise<string> {
    const addressInfo = await asyncLookup(requestUrl.hostname, { all: true })
    return new Promise((resolve, reject) => {
        const probeCancelToken = Axios.CancelToken.source()
        let complete = false
        // Cancel DNS probes if overarching request was cancelled
        if (cancelToken !== undefined) {
            cancelToken.promise.then(() => {
                complete = true
                probeCancelToken.cancel()
            })
        }
        const requests = addressInfo.map(info => {
            const testingUrl = new URL(requestUrl.toString())
            testingUrl.hostname = info.address
            return Axios.head(testingUrl.toString(), {
                headers: { Host: requestUrl.hostname },
                cancelToken: probeCancelToken.token,
                timeout: 5000
            })
                .then(() => {
                    complete = true
                    probeCancelToken.cancel()
                    log.debug('Resolved', requestUrl.hostname, 'to', info.address)
                    resolve(info.address)
                    return undefined
                })
                .catch(error => {
                    if (Axios.isCancel(error)) {
                        return undefined
                    }
                    return error as AxiosError
                })
        })
        Promise.all(requests).then(responses => {
            const errors = responses.filter(response => response !== undefined) as AxiosError[]
            // If all failed, throw an error
            if (!complete) {
                log.info('All failed DNS HEAD probe responses:')
                errors.forEach(response => log.info(formatAxiosError(response)))
                reject(new RequestError('All DNS HEAD probes failed. Check logs.'))
                return
            }
            // Check if some failed and warn
            if (errors.length > 0) {
                log.warn('Some DNS HEAD probes failed:')
                errors.forEach(response => log.warn(formatAxiosError(response)))
            }
        })
    })
}
