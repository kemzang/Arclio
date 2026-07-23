import {Arclio, type ArclioConfig} from './Arclio'

export function bootstrap(config: ArclioConfig): Arclio {
	return new Arclio(config)
}
