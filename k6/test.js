import http from 'k6/http';
import exec from 'k6/execution';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    foo: {
        executor: 'constant-arrival-rate',
        // 100 iterations per second, i.e. exactly 100 RPS, since each
        // iteration has just a single request
        rate: 5000, timeUnit: '1s',
        // for how long do you want the scenario to run
        duration: '30s',
        // this number doesn't really matter, as long as it's high enough
        // that there is always a free VU to run an iteration on
        preAllocatedVUs: 500,
    },
},
};
export default function () {
  const res = http.get('http://localhost:3001/qa/questions?product_id=312430&page=1&count=5');
  check(res, { 'status was 200': (r) => r.status == 200 });
}