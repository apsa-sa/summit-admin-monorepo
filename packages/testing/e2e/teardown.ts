// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { JourneyFixture } from './journey-fixture.js';
class JourneyTeardown {static async run():Promise<void>{await new JourneyFixture().teardown();}}
export default JourneyTeardown.run;
