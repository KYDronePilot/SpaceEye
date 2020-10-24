import Axios from 'axios'
import Dns from 'dns'
import Url from 'url'
import { promisify } from 'util'

const asyncLookup = promisify(Dns.lookup)

/**
 * Resolve the IP of a request URL by sending a HEAD request to each A record,
 * using the first IP to respond.
 *
 * @param requestUrl - URL being requested
 * @returns Resolved IP address
 */
export async function resolveDns(requestUrl: Url.URL): Promise<string> {
    const addressInfo = await asyncLookup(requestUrl.hostname, { all: true })
    return new Promise((resolve, reject) => {
        addressInfo.forEach(info => {
            const testingUrl = new URL(requestUrl.toString())
            testingUrl.hostname = info.address
            Axios.head(testingUrl.toString(), {
                headers: { Host: requestUrl.hostname }
            }).then(() => {
                console.log(`Heard back from: ${info.address}`)
                resolve(info.address)
            })
        })
    })
}
