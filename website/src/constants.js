export const VIRAL_CONSENSUS_VERSION = "0.0.3";
export const MINIMAP2_VERSION = "2.22";
export const FASTP_VERSION = "0.20.1";
export const BIOWASM_WORKING_DIR = "/shared/data/";
export const OUTPUT_ID = "output-text";
export const EXAMPLE_REF_FILE = "https://raw.githubusercontent.com/niemasd/ViralConsensus/master/example/NC_045512.2.fas";
export const DEFAULT_REF_FILE_NAME = BIOWASM_WORKING_DIR + 'ref.fas';
export const EXAMPLE_ALIGNMENT_FILE = "https://raw.githubusercontent.com/niemasd/ViralConsensus/master/example/example.trimmed.unsorted.bam";
export const DEFAULT_ALIGNMENT_SAM_FILE_NAME = BIOWASM_WORKING_DIR + 'alignments.sam';
export const DEFAULT_ALIGNMENT_BAM_FILE_NAME = BIOWASM_WORKING_DIR + 'alignments.bam';
export const DEFAULT_PRIMER_FILE_NAME = BIOWASM_WORKING_DIR + 'primers.txt';
export const TEMP_FASTP_INPUT = BIOWASM_WORKING_DIR + 'temp.fastq.gz';
export const TEMP_FASTP_OUTPUT = BIOWASM_WORKING_DIR + 'temp-trimmed.fastq.gz';
export const COMBINED_SEQUENCES_FILE_NAME = BIOWASM_WORKING_DIR + 'sequences.fastq.gz';
export const FASTP_OUTPUT_FILE_NAME = BIOWASM_WORKING_DIR + 'trimmed-sequences.fastq.gz';
export const MINIMAP_OUTPUT_FILE_NAME = BIOWASM_WORKING_DIR + 'reads.sam';
export const DEFAULT_VALS_FILE = "https://raw.githubusercontent.com/niemasd/ViralConsensus/main/common.h";
export const DEFAULT_VALS_MAPPING = {
	"DEFAULT_MIN_QUAL": "minBaseQuality",
	"DEFAULT_MIN_DEPTH": "minDepth",
	"DEFAULT_MIN_FREQ": "minFreq",
	"DEFAULT_AMBIG": "ambigSymbol",
	"DEFAULT_PRIMER_OFFSET": "primerOffset",
}
export const CONSENSUS_FILE_NAME = BIOWASM_WORKING_DIR + 'consensus.fa';
export const POSITION_COUNTS_FILE_NAME = BIOWASM_WORKING_DIR + 'positionCounts.tsv';
export const INSERTION_COUNTS_FILE_NAME = BIOWASM_WORKING_DIR + 'insertionCounts.json';
export const DEFAULT_INPUT_STATE = {
	fastpOpen: false,

	// ------- User input -------
	refFile: undefined,
	refFileValid: true,

	alignmentFiles: undefined,
	alignmentFilesAreFASTQ: false,
	alignmentFilesValid: true,

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
	genInsCounts: false
}

export const ARE_FASTQ = (files) => {
	if (files === undefined || files.length === 0) {
		return false;
	}

	for (const file of files) {
		const name = file.name;
		if (!(name !== undefined && (
			name.endsWith('.fastq') ||
			name.endsWith('.fq') ||
			name.endsWith('.fastq.gz') ||
			name.endsWith('.fq.gz')
		))) {
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

export const CLEAR_LOG = () => {
	const textArea = document.getElementById(OUTPUT_ID);
	textArea.value = "";
}

export const LOG = (output) => {
	const textArea = document.getElementById(OUTPUT_ID);
	const date = new Date();
	textArea.value += `${getTimeWithMilliseconds(date)}: ` + output + "\n";
}

export const getTimeWithMilliseconds = date => {
	const t = date.toLocaleTimeString();
	return `${t.substring(0, 7)}.${("00" + date.getMilliseconds()).slice(-3)}`;
}