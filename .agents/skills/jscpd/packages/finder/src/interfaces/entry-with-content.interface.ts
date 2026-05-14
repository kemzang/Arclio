import {Entry} from 'fast-glob';

export interface IEntry extends Entry {
	detectedFormat?: string;
}

export interface EntryWithContent extends IEntry {
	content: string;
}
