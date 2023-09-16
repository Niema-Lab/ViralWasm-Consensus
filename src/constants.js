// TODO: auto download the versions during the github action? 
export const VIRAL_CONSENSUS_VERSION = "0.0.3";
export const MINIMAP2_VERSION = "2.22";
export const FASTP_VERSION = "0.20.1";

export const REF_GENOMES_DIR = "data/ref_genomes/";
export const REF_GENOME_REPO_STRUCTURE_LINK = "/data/repo_structure.json";
// reference genomes for common viruses
export const REFS = {
    'bombalivirus':    'NC_039345', // Bombali Virus (Bombali ebolavirus)
    'bundibugyovirus': 'NC_014373', // Bundibugyo Virus (Bundibugyo ebolavirus)
    'denv1':           'NC_001477', // Dengue Virus 1
    'denv2':           'NC_001474', // Dengue Virus 2
    'denv3':           'NC_001475', // Dengue Virus 3
    'denv4':           'NC_002640', // Dengue Virus 4
    'ebolavirus':      'NC_002549', // Ebola Virus (Zaire ebolavirus)
    'hcv1':            'NC_004102', // HCV genotype 1
    'hcv1h77':         'NC_038882', // HCV genotpye 1 (isolate H77)
    'hcv2':            'NC_009823', // HCV genotype 2
    'hcv3':            'NC_009824', // HCV genotype 3
    'hcv4':            'NC_009825', // HCV genotype 4
    'hcv5':            'NC_009826', // HCV genotype 5
    'hcv6':            'NC_009827', // HCV genotype 6
    'hcv7':            'NC_030791', // HCV genotype 7
    'hiv1':            'NC_001802', // HIV-1
    'hiv2':            'NC_001722', // HIV-2
    'monkeypox':       'NC_063383', // Monkeypox Virus
    'restonvirus':     'NC_004161', // Reston Virus (Reston ebolavirus)
    'sarscov2':        'NC_045512', // SARS-CoV-2 (COVID-19)
    'sudanvirus':      'NC_006432', // Sudan Virus (Sudan ebolavirus)
    'taiforestvirus':  'NC_014372', // Tai Forest Virus (Tai Forest ebolavirus, Cote d'Ivoire ebolavirus)
}
export const REF_NAMES = {
    'DENV': {
        'denv1':           'Dengue Virus 1',
        'denv2':           'Dengue Virus 2',
        'denv3':           'Dengue Virus 3',
        'denv4':           'Dengue Virus 4',
    },

    'Ebola': {
        'bombalivirus':    'Bombali Virus (Bombali ebolavirus)',
        'bundibugyovirus': 'Bundibugyo Virus (Bundibugyo ebolavirus)',
        'ebolavirus':      'Ebola Virus (Zaire ebolavirus)',
        'restonvirus':     'Reston Virus (Reston ebolavirus)',
        'sudanvirus':      'Sudan Virus (Sudan ebolavirus)',
        'taiforestvirus':  'Tai Forest Virus (Tai Forest ebolavirus, Cote d\'Ivoire ebolavirus)',
    },

    'HCV': {
        'hcv1':            'HCV genotype 1',
        'hcv1h77':         'HCV genotpye 1 (isolate H77)',
        'hcv2':            'HCV genotype 2',
        'hcv3':            'HCV genotype 3',
        'hcv4':            'HCV genotype 4',
        'hcv5':            'HCV genotype 5',
        'hcv6':            'HCV genotype 6',
        'hcv7':            'HCV genotype 7',
    },
    
    'HIV': {
        'hiv1':            'HIV-1',
        'hiv2':            'HIV-2',
    },

    'Monkeypox': {
        'monkeypox':       'Monkeypox Virus',
    },
    
    'SARS-CoV-2': {
        'sarscov2':        'SARS-CoV-2 (COVID-19)',
    }
}

export const OFFLINE_INSTRUCTIONS = "/README.md";
export const OFFLINE_INSTRUCTIONS_KEYWORDS = "<h3>ViralWasm-Consensus Offline</h3>\n";
export const BIOWASM_WORKING_DIR = "/shared/data/";
export const OUTPUT_ID = "output-text";
export const EXAMPLE_REF = "NC_045512"; // SARS-CoV-2 (COVID-19)
export const DEFAULT_REF_FILE_NAME = BIOWASM_WORKING_DIR + 'ref.fas';
export const EXAMPLE_ALIGNMENT_FILE = "data/example.bam";
export const DEFAULT_ALIGNMENT_SAM_FILE_NAME = BIOWASM_WORKING_DIR + 'alignments.sam';
export const DEFAULT_ALIGNMENT_BAM_FILE_NAME = BIOWASM_WORKING_DIR + 'alignments.bam';
export const DEFAULT_PRIMER_FILE_NAME = BIOWASM_WORKING_DIR + 'primers.txt';
export const TEMP_FASTP_INPUT = BIOWASM_WORKING_DIR + 'temp.fastq.gz';
export const TEMP_FASTP_OUTPUT = BIOWASM_WORKING_DIR + 'temp-trimmed.fastq.gz';
export const COMBINED_SEQUENCES_FILE_NAME = BIOWASM_WORKING_DIR + 'sequences.fastq.gz';
export const FASTP_OUTPUT_FILE_NAME = BIOWASM_WORKING_DIR + 'trimmed-sequences.fastq.gz';
export const MINIMAP_OUTPUT_FILE_NAME = BIOWASM_WORKING_DIR + 'reads.sam';
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
		const extension = name.slice(extensionIndex);
		
		if (!(extension.includes('fastq') || extension.includes('fq'))) {
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