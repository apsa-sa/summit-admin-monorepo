// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { JourneyFixture } from './journey-fixture.js';
class JourneySetup {static async run():Promise<void>{await new JourneyFixture().setup();}}
export default JourneySetup.run;
