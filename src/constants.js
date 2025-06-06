// TODO: auto download the versions during the github action? 
export const VIRAL_CONSENSUS_VERSION = "0.0.6";
export const MINIMAP2_VERSION = "2.22";
export const FASTP_VERSION = "0.20.1";

export const REF_GENOMES_DIR = "data/Reference-Genomes/";
export const REF_GENOME_REPO_STRUCTURE_LINK = "data/REFS.json";

export const OFFLINE_INSTRUCTIONS = "/README.md";
export const OFFLINE_INSTRUCTIONS_KEYWORDS_START = "<h2>ViralWasm-Consensus Offline</h2>\n";
export const OFFLINE_INSTRUCTIONS_KEYWORDS_END = "<h2>Citing ViralWasm-Consensus</h2>\n";
export const BIOWASM_WORKING_DIR = "/shared/data/";
export const OUTPUT_ID = "output-text";
export const EXAMPLE_REF = "NC_045512"; // SARS-CoV-2 (COVID-19)
export const DEFAULT_REF_FILE_NAME = BIOWASM_WORKING_DIR + 'ref.fas';
export const EXAMPLE_INPUT_FILE = "data/example.bam";
export const DEFAULT_INPUT_SAM_FILE_NAME = BIOWASM_WORKING_DIR + 'inputs.sam';
export const DEFAULT_INPUT_BAM_FILE_NAME = BIOWASM_WORKING_DIR + 'inputs.bam';
export const DEFAULT_PRIMER_FILE_NAME = BIOWASM_WORKING_DIR + 'primers.txt';
export const TEMP_FASTP_INPUT = BIOWASM_WORKING_DIR + 'temp.fastq.gz';
export const TEMP_FASTP_OUTPUT = BIOWASM_WORKING_DIR + 'temp-trimmed.fastq.gz';
export const SEQUENCES_FILE_NAME = BIOWASM_WORKING_DIR + 'sequences.fastq.gz';
export const TRIMMED_SEQUENCES_FILE_NAME = BIOWASM_WORKING_DIR + 'trimmed-sequences.fastq.gz';
export const DEFAULT_VALS = {
	minBaseQuality: 20,
	minBaseQualityDefault: 20,
	minDepth: 10,
	minDepthDefault: 10,
	minFreq: 0.5,
	minFreqDefault: 0.5,
	ambigSymbol: "N",
	ambigSymbolDefault: "N",
	primerOffset: 0,
	primerOffsetDefault: 0,
}
export const CONSENSUS_FILE_NAME = BIOWASM_WORKING_DIR + 'consensus.fa';
export const POSITION_COUNTS_FILE_NAME = BIOWASM_WORKING_DIR + 'positionCounts.tsv';
export const INSERTION_COUNTS_FILE_NAME = BIOWASM_WORKING_DIR + 'insertionCounts.json';
export const DEFAULT_INPUT_STATE = {
	fastpOpen: false,

	// ------- User input -------
	preloadedRef: undefined,
	refFiles: undefined,
	refFilesValid: true,

	exampleDataLoaded: false,
	inputFiles: undefined,
	inputFilesAreFASTQ: false,
	inputFilesValid: true,

	// ------- Fastp input -------
	trimInput: false,

	fastpCompressionLevel: 9,
	fastpCompressionLevelValid: true,

	trimFront1: 0,
	trimFront1Valid: true,

	trimTail1: 0,
	trimTail1Valid: true,

	trimPolyG: false,
	trimPolyX: false,

	// ------- ViralConsensus additional arguments -------
	primerFile: undefined,
	primerFileValid: true,

	primerOffset: 0,
	primerOffsetValid: true,

	minBaseQuality: 0,
	minBaseQualityValid: true,

	minDepth: 0,
	minDepthValid: true,

	minFreq: 0,
	minFreqValid: true,

	ambigSymbol: 'N',
	ambigSymbolValid: true,

	genPosCounts: false,
	genInsCounts: false,

	...DEFAULT_VALS,
}

export const ARE_FASTQ = (files) => {
	if (files === undefined || files.length === 0) {
		return false;
	}

	for (const file of files) {
		const name = file.name;
		const extensionIndex = name.indexOf('.') === -1 ? name.length : name.indexOf('.');
		const extension = name.slice(extensionIndex).toLowerCase();

		if (!(extension.includes('fa') || extension.includes('fq'))) {
			return false;
		}
	}

	return true;
}

export const IS_GZIP = (arrayBuffer) => {
	if (arrayBuffer.byteLength < 2) {
		return false;
	}

	const uint8Array = new Uint8Array(arrayBuffer.slice(0, 2));
	return uint8Array[0] === 0x1f && uint8Array[1] === 0x8b;
}

export const INPUT_IS_NONNEG_INTEGER = (input, lowBound = 0, upperBound = Number.MAX_SAFE_INTEGER) => {
	return (input === '' || (input >= lowBound && input <= upperBound && input == parseInt(input)))
}

export const ERROR_MSG = (tool) => {
	return `Error running ${tool} as part of ViralWasm-Consensus pipeline. Please check your input and try again.`;
}

export const CLEAR_LOG = () => {
	const textArea = document.getElementById(OUTPUT_ID);
	textArea.value = "";
}

export const GET_TIME_WITH_MILLISECONDS = date => {
	const t = date.toLocaleTimeString([], { hour12: false });
	return `${t.substring(0, 8)}.${("00" + date.getMilliseconds()).slice(-3)}`;
}
