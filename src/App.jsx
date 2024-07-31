// TODO: PWA? 
import React, { Component } from 'react'
import Pako from 'pako';
import { marked } from 'marked';
import { TarWriter } from '@gera2ld/tarjs';
import { BlobWriter, ZipWriter } from "@zip.js/zip.js";

import 'bootstrap/dist/css/bootstrap.min.css';
import "bootstrap-icons/font/bootstrap-icons.css";


import {
	VIRAL_CONSENSUS_VERSION,
	MINIMAP2_VERSION,
	FASTP_VERSION,
	OFFLINE_INSTRUCTIONS,
	OFFLINE_INSTRUCTIONS_KEYWORDS_START,
	OFFLINE_INSTRUCTIONS_KEYWORDS_END,
	REF_GENOMES_DIR,
	REF_GENOME_REPO_STRUCTURE_LINK,
	CLEAR_LOG,
	OUTPUT_ID,
	GET_TIME_WITH_MILLISECONDS,
	EXAMPLE_INPUT_FILE,
	DEFAULT_INPUT_BAM_FILE_NAME,
	DEFAULT_INPUT_SAM_FILE_NAME,
	TEMP_FASTP_INPUT,
	TEMP_FASTP_OUTPUT,
	TRIMMED_SEQUENCES_FILE_NAME,
	EXAMPLE_REF,
	BIOWASM_WORKING_DIR,
	DEFAULT_REF_FILE_NAME,
	DEFAULT_PRIMER_FILE_NAME,
	ARE_FASTQ,
	IS_GZIP,
	INPUT_IS_NONNEG_INTEGER,
	INSERTION_COUNTS_FILE_NAME,
	POSITION_COUNTS_FILE_NAME,
	CONSENSUS_FILE_NAME,
	DEFAULT_INPUT_STATE,
	ERROR_MSG,
	SEQUENCES_FILE_NAME
} from './constants'

import './App.scss'

import loading from './assets/loading.png'

export class App extends Component {
	constructor(props) {
		super(props)

		this.state = {
			expandedContainer: undefined,
			additionalArgsOpen: false,
			showOfflineInstructions: false,
			offlineInstructions: undefined,
			outputAutoscroll: true,

			refGenomes: undefined,

			exampleInputFile: undefined,

			fastpCompressionLevelDefault: 9,
			trimFront1Default: 0,
			trimTail1Default: 0,
			primerOffsetDefault: 0,
			minBaseQualityDefault: 0,
			minDepthDefault: 0,
			minFreqDefault: 0,
			ambigSymbolDefault: 'N',

			...DEFAULT_INPUT_STATE,

			// ------- Biowasm & output states -------
			CLI: undefined,
			done: false,
			errorMessage: undefined,
			timeElapsed: undefined,
			consensusFiles: undefined,
			posCountsFiles: undefined,
			insCountsFiles: undefined,
			trimmedOutputFiles: undefined,
			alignedOutputFiles: undefined,
			loading: false,
			inputChanged: false,
			compressSingle: false,
			downloadZip: false,
		}
	}

	async componentDidMount() {
		this.setState({
			CLI: await new window.Aioli([{
				tool: "ViralConsensus",
				program: "viral_consensus",
				version: VIRAL_CONSENSUS_VERSION,
				urlPrefix: `${window.location.origin}${import.meta.env.BASE_URL || ''}tools/viral_consensus`,
			}, {
				tool: "minimap2",
				version: MINIMAP2_VERSION,
				urlPrefix: `${window.location.origin}${import.meta.env.BASE_URL || ''}tools/minimap2`,
			}, {
				tool: "fastp",
				version: FASTP_VERSION,
				urlPrefix: `${window.location.origin}${import.meta.env.BASE_URL || ''}tools/fastp`,
			}, "coreutils/du/8.32"], {
				printInterleaved: false,
				printStream: true,
				callback: (msg) => this.log((msg.stderr ?? msg.stdout) + '\n', false),
			})
		}, async () => {
			CLEAR_LOG()
			this.log("ViralWasm-Consensus loaded.")
		})

		this.preventNumberInputScrolling();
		this.fetchExampleFiles();
		this.initPreloadedRefs();
		this.fetchOfflineInstructions();
		this.addOfflineInstructionsListener();
	}

	preventNumberInputScrolling = () => {
		const numberInputs = document.querySelectorAll('input[type=number]');
		for (const numberInput of numberInputs) {
			numberInput.addEventListener('wheel', function (e) {
				e.preventDefault();
			});
		}
	}

	// Fetch example file data (only once on mount)
	fetchExampleFiles = async () => {
		const exampleInputFile = await (await fetch(`${import.meta.env.BASE_URL || ''}${EXAMPLE_INPUT_FILE}`)).arrayBuffer();

		this.setState({ exampleInputFile: exampleInputFile })
	}

	initPreloadedRefs = async () => {
		const REFS = await (await fetch(`${import.meta.env.BASE_URL || ''}${REF_GENOME_REPO_STRUCTURE_LINK}`)).json();
		const preloadRefOptions = Object.entries(REFS).map(arr =>
			<option value={arr[0]} key={arr[1].name}>{arr[1].name}</option>
		)

		preloadRefOptions.sort((a, b) => a.key.localeCompare(b.key));
		this.setState({ preloadRefOptions })
	}

	fetchOfflineInstructions = async () => {
		const res = await fetch(`${window.location.origin}${import.meta.env.BASE_URL || ''}${OFFLINE_INSTRUCTIONS}`);
		const text = await res.text();
		const html = marked(text);
		let offlineInstructions = html.slice(html.indexOf(OFFLINE_INSTRUCTIONS_KEYWORDS_START) + OFFLINE_INSTRUCTIONS_KEYWORDS_START.length)
		offlineInstructions = offlineInstructions.slice(0, offlineInstructions.indexOf(OFFLINE_INSTRUCTIONS_KEYWORDS_END))
		this.setState({ offlineInstructions });
	}

	addOfflineInstructionsListener = () => {
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') {
				this.hideOfflineInstructions();
			}
		})
	}

	selectRefFiles = (e) => {
		const refFiles = [...(this.state.refFiles || []), ...Array.from(e.target.files)];
		this.setState({
			exampleDataLoaded: false,
			preloadedRef: undefined,
			refFiles,
			refFilesValid: true,
			inputChanged: true,
		})
		if (refFiles.length > 1) {
			document.getElementById('reference-file').value = null;
		}
	}

	clearRefFiles = () => {
		if (this.state.refFiles !== undefined) {
			this.setState({ inputChanged: true })
		}
		this.setState({ refFiles: undefined })
		document.getElementById('reference-file').value = null;
	}

	deleteRefFile = (index) => {
		document.getElementById("reference-file").value = null;

		const refFiles = [...this.state.refFiles];
		refFiles.splice(index, 1);

		this.setState({
			refFiles,
			refFilesValid: refFiles.length > 0,
			inputChanged: true
		})
	}

	setPreloadedRef = (event) => {
		this.setState(prevState => {
			return {
				exampleDataLoaded: false,
				preloadedRef: event.target.value === '' ? undefined : event.target.value,
				inputChanged: true,
				refFilesValid: true,
				inputFiles: prevState.exampleDataLoaded ? undefined : prevState.inputFiles,
			}
		})
	}

	selectInputFiles = (e) => {
		const currentInputFiles = this.state.exampleDataLoaded ? [] : this.state.inputFiles;
		const inputFiles = [...(currentInputFiles || []), ...Array.from(e.target.files)];
		this.setState({
			exampleDataLoaded: false,
			inputFiles: inputFiles,
			inputFilesValid: this.validInputFiles(inputFiles),
			inputChanged: true,
			inputFilesAreFASTQ: ARE_FASTQ(inputFiles),
		})
		if (inputFiles.length > 1) {
			document.getElementById('input-files').value = null;
		}
	}

	validInputFiles = (files) => {
		if (files === undefined) {
			return false;
		}

		if (files.length === 0) {
			return false;
		}

		if (files.length === 1) {
			return true;
		}

		return ARE_FASTQ(files);
	}

	clearInputFiles = () => {
		this.setState({
			inputFiles: undefined,
			inputFilesValid: true,
			inputChanged: true,
			inputFilesAreFASTQ: false,
		})
		document.getElementById('input-files').value = null;
	}

	deleteInputFile = (index) => {
		document.getElementById("input-files").value = null;

		const inputFiles = [...this.state.inputFiles];
		inputFiles.splice(index, 1);

		const inputFilesValid = this.validInputFiles(inputFiles);
		const inputFilesAreFASTQ = ARE_FASTQ(inputFiles);
		this.setState({
			inputFiles,
			inputFilesValid,
			inputFilesAreFASTQ,
			inputChanged: true
		})
	}

	setTrimInput = (e) => {
		this.setState({ trimInput: e.target.checked, inputChanged: true })
	}

	setFastpCompressionLevel = (e) => {
		let fastpCompressionLevelValid = INPUT_IS_NONNEG_INTEGER(e.target.value, 1, 9)

		this.setState({ fastpCompressionLevel: e.target.value, fastpCompressionLevelValid, inputChanged: true })
	}

	setTrimFront1 = (e) => {
		let trimFront1Valid = INPUT_IS_NONNEG_INTEGER(e.target.value);

		this.setState({ trimFront1: e.target.value, trimFront1Valid, inputChanged: true })
	}

	setTrimTail1 = (e) => {
		let trimTail1Valid = INPUT_IS_NONNEG_INTEGER(e.target.value);

		this.setState({ trimTail1: e.target.value, trimTail1Valid, inputChanged: true })
	}

	setTrimPolyG = (e) => {
		this.setState({ trimPolyG: e.target.checked, inputChanged: true })
	}

	setTrimPolyX = (e) => {
		this.setState({ trimPolyX: e.target.checked, inputChanged: true })
	}

	selectPrimerFile = (e) => {
		this.setState({ primerFile: e.target.files[0], inputChanged: true })
	}

	setPrimerOffset = (e) => {
		let primerOffsetValid = INPUT_IS_NONNEG_INTEGER(e.target.value);

		this.setState({ primerOffset: e.target.value, primerOffsetValid, inputChanged: true })
	}

	setMinBaseQuality = (e) => {
		let minBaseQualityValid = INPUT_IS_NONNEG_INTEGER(e.target.value);

		this.setState({ minBaseQuality: e.target.value, minBaseQualityValid, inputChanged: true })
	}

	setMinDepth = (e) => {
		let minDepthValid = INPUT_IS_NONNEG_INTEGER(e.target.value);

		this.setState({ minDepth: e.target.value, minDepthValid, inputChanged: true })
	}

	setMinFreq = (e) => {
		let minFreqValid = true;

		if (e.target.value < 0 || e.target.value > 1) {
			minFreqValid = false;
		}

		this.setState({ minFreq: e.target.value, minFreqValid, inputChanged: true })
	}

	setAmbigSymbol = (e) => {
		let ambigSymbolValid = true;

		if (e.target.value.length !== 1) {
			ambigSymbolValid = false;
		}

		this.setState({ ambigSymbol: e.target.value, ambigSymbolValid, inputChanged: true })
	}

	setGenPosCounts = (e) => {
		this.setState({ genPosCounts: e.target.checked, inputChanged: true })
	}

	setGenInsCounts = (e) => {
		this.setState({ genInsCounts: e.target.checked, inputChanged: true })
	}

	toggleAdditionalArgs = (open = undefined) => {
		this.setState(prevState => {
			return { additionalArgsOpen: open === undefined ? !prevState.additionalArgsOpen : open }
		})
	}

	toggleLoadExampleData = () => {
		this.setState(prevState => {
			const notExampleOrEmptyData = (prevState.exampleDataLoaded && prevState.inputFiles !== undefined && prevState.inputFiles.length > 0)
				|| (prevState.refFiles !== undefined && prevState.refFileName.length > 0)
				|| (prevState.preloadedRef !== EXAMPLE_REF && prevState.preloadedRef !== undefined);
			if (notExampleOrEmptyData && !window.confirm("Are you sure you want to load example data? All current input data will be lost.")) {
				return;
			}
			document.getElementById('input-files').value = null;
			document.getElementById('reference-file').value = null;
			return {
				preloadedRef: EXAMPLE_REF,
				exampleDataLoaded: true,
				refFiles: undefined,
				inputFiles: undefined,
				inputFilesAreFASTQ: false,
				refFilesValid: true,
				inputFilesValid: true,
				inputChanged: true,
			}
		})
	}

	toggleExpandContainer = (container) => {
		this.setState(prevState => {
			return { expandedContainer: prevState.expandedContainer === container ? undefined : container }
		});
	}

	toggleOutputAutoscroll = () => {
		this.setState(prevState => { return { outputAutoscroll: !prevState.outputAutoscroll } });
	}

	promptResetInput = () => {
		if (window.confirm("Are you sure you want to reset? All input data will be lost.")) {
			this.resetInput();
		}
	}

	resetInput = () => {
		this.setState(Object.assign({}, DEFAULT_INPUT_STATE), () => {
			const defaults = {};
			for (const stateKey of Object.keys(this.state)) {
				if (stateKey.endsWith('Default')) {
					defaults[stateKey.slice(0, -7)] = this.state[stateKey];
				}
			}
			this.setState(defaults);
		});
		document.getElementById('reference-file').value = null;
		document.getElementById('input-files').value = null;
		document.getElementById('primer-file').value = null;
	}

	validInput = () => {
		let valid = true;
		let refFilesValid = true;
		let inputFilesValid = true;
		// Note: Other input validation is done in the setters

		CLEAR_LOG()
		this.log("Validating input...")

		if ((!this.state.refFiles || this.state.refFiles.length === 0) && !this.state.preloadedRef) {
			refFilesValid = false;
		}

		if (!this.state.exampleDataLoaded && !this.validInputFiles(this.state.inputFiles)) {
			inputFilesValid = false;
		}

		valid = refFilesValid && inputFilesValid &&
			this.state.primerOffsetValid &&
			this.state.minBaseQualityValid &&
			this.state.minDepthValid &&
			this.state.minFreqValid &&
			this.state.ambigSymbolValid &&
			this.state.trimFront1Valid &&
			this.state.trimTail1Valid &&
			this.state.fastpCompressionLevelValid;

		this.setState({ refFilesValid, inputFilesValid })

		return valid;
	}

	run = async () => {
		if (this.state.loading) {
			alert('Current job is running. To run a new job, please wait for the current job to finish or refresh the page.');
			return;
		}

		if (!this.validInput()) {
			alert("Invalid input. Please check your input and try again.")
			this.log("Invalid input. Please check your input and try again.")
			return;
		}

		if (this.state.CLI === undefined) {
			setTimeout(this.run, 1000)
		} else {
			window.scrollTo({
				top: window.innerHeight / 4,
				left: 0,
				behavior: 'instant'
			});

			// Delete old files
			this.log("Deleting old files...")
			await this.clearFiles();

			const startTime = performance.now();
			try {
				await this.runViralConsensus();
			} catch (e) {
				this.log('\n', false);
				this.log(ERROR_MSG(e.message));
				console.log(e);
				this.setState({ errorMessage: ERROR_MSG(e.message) })
			}
			this.setState({ loading: false, done: true, timeElapsed: ((performance.now() - startTime) / 1000).toFixed(3) })
			this.log(`Done! Time Elapsed: ${((performance.now() - startTime) / 1000).toFixed(3)} seconds`);
			this.log(`Estimated Peak Memory: ${(await this.getMemory() / 1000000).toFixed(3)} MB`);
		}
	}

	runViralConsensus = async () => {
		const CLI = this.state.CLI;
		this.setState({
			errorMessage: undefined,
			done: false,
			timeElapsed: undefined,
			loading: true,
			inputChanged: false,
			consensusFiles: undefined,
			posCountsFiles: undefined,
			insCountsFiles: undefined,
			trimmedOutputFiles: undefined,
			alignedOutputFiles: undefined
		})

		let sequencesFileName = undefined;

		// handle fastq files, need to gzip / run fastp
		if (this.state.inputFilesAreFASTQ) {
			sequencesFileName = this.trimInput ? TRIMMED_SEQUENCES_FILE_NAME : SEQUENCES_FILE_NAME;
			let totalFastp = 0;
			for (let i = 0; i < this.state.inputFiles.length; i++) {
				const inputFile = this.state.inputFiles[i];
				let inputFileData = await this.fileReaderReadFile(inputFile, true);
				if (!IS_GZIP(inputFileData)) {
					this.log("Gzipping selected input file " + inputFile.name + " before running minimap2...")
					inputFileData = Pako.gzip(inputFileData);
				} else {
					this.log("Input file " + inputFile.name + " is already gzipped, skipping gzip...")
				}
				if (this.state.trimInput) {
					const fastpStartTime = performance.now();
					inputFileData = await this.trimInput(inputFileData)
					const time = (performance.now() - fastpStartTime);
					this.log('\n', false)
					this.log(`${inputFile.name} trimming finished in ${(time / 1000).toFixed(3)} seconds\n`)
					totalFastp += time;
				}
				await CLI.fs.writeFile(sequencesFileName, new Uint8Array(inputFileData), { flags: 'a' });
				inputFileData = undefined;
			}
			if (this.state.trimInput) {
				this.log(`Fastp finished in ${(totalFastp / 1000).toFixed(3)} seconds`)
			}
			await this.deleteFile(TEMP_FASTP_INPUT);
			await this.deleteFile(TEMP_FASTP_OUTPUT);
			const trimmedOutputFiles = this.state.inputFilesAreFASTQ && this.state.trimInput && (await CLI.ls(TRIMMED_SEQUENCES_FILE_NAME))?.size > 0;
			this.setState({ trimmedOutputFiles: trimmedOutputFiles ? [TRIMMED_SEQUENCES_FILE_NAME] : undefined });
		}

		// handle reference file
		let refFilesSequences = undefined;
		this.log("Reading reference file(s)...")
		// Using example reference file, create example reference fasta file
		if (this.state.refFiles === undefined || this.state.refFiles.length === 0) {
			const refFilesData = await (await fetch(`${import.meta.env.BASE_URL || ''}${REF_GENOMES_DIR}${this.state.preloadedRef}/${this.state.preloadedRef}.fas`)).text();
			await CLI.fs.writeFile(DEFAULT_REF_FILE_NAME, refFilesData);
			refFilesSequences = [refFilesData];
		} else {
			const refFilesData = await this.fileReaderReadAndMergeFiles(this.state.refFiles);
			refFilesSequences = refFilesData
				// first split by > to get each sequence
				.split(/(?=>)/g)
				// remove empty strings by splitting by newlines, removing whitespace, 
				// filtering out empty strings, and joining back together
				.map(seq => seq.split("\n")
					.map(line => line.trim())
					.filter(line => line.length > 0)
					.join("\n"));

			if (refFilesSequences.some(seq => seq.length === 0)) {
				this.log("Error: Invalid reference file. Contains empty sequences.")
				throw new Error('Invalid reference file');
			}
		}

		const singleRefInputFileName = (this.state.exampleDataLoaded || this.state.inputFiles[0]?.name?.endsWith('.bam')) ?
			DEFAULT_INPUT_BAM_FILE_NAME : DEFAULT_INPUT_SAM_FILE_NAME;

		// don't do special file creation / handling if there's only one sequence
		if (refFilesSequences.length === 1) {
			await CLI.fs.writeFile(DEFAULT_REF_FILE_NAME, refFilesSequences[0]);
			const outputFiles = await this.runViralConsensusSingleReference(singleRefInputFileName, sequencesFileName);
			this.setState({ ...outputFiles });
		} else {
			this.log(`Detected ${refFilesSequences.length} sequences from ${this.state.refFiles.length} reference file(s). Running consensus for each sequence...`)
			const allFiles = {};
			const repeatedPrefixes = {};
			for (let i = 0; i < refFilesSequences.length; i++) {
				// if the input files are fastq, we need to run minimap2 on each sequence (aligning to each reference)
				// otherwise, we can just run viral consensus on the input file (which doesn't vay by reference)
				const seqData = refFilesSequences[i];
				// get the first 30 characters of the sequence header to use as a prefix 
				// add a number if there are multiple sequences with the same prefix
				let seqHeaderPrefix = seqData.split("\n")[0].substring(1, 30);
				seqHeaderPrefix = seqHeaderPrefix.replace(/[/\\?%*:|"<>]/g, '-');
				seqHeaderPrefix = seqHeaderPrefix.replace(/[\s.]/g, '_');
				seqHeaderPrefix += repeatedPrefixes[seqHeaderPrefix] >= 1 ? `-${repeatedPrefixes[seqHeaderPrefix]}` : '';
				if (repeatedPrefixes[seqHeaderPrefix] === undefined) {
					repeatedPrefixes[seqHeaderPrefix] = 1;
				} else {
					repeatedPrefixes[seqHeaderPrefix]++;
				}
				const inputFileName = this.state.inputFilesAreFASTQ
					? `${BIOWASM_WORKING_DIR}${seqHeaderPrefix}.sam`
					: singleRefInputFileName;
				const refFileName = `${BIOWASM_WORKING_DIR}${seqHeaderPrefix}.ref.fas`;
				const consenusFileName = `${BIOWASM_WORKING_DIR}${seqHeaderPrefix}.consensus.fas`;
				const positionCountsFileName = `${BIOWASM_WORKING_DIR}${seqHeaderPrefix}.positionCounts.tsv`;
				const insertionCountsFileName = `${BIOWASM_WORKING_DIR}${seqHeaderPrefix}.insertionCounts.tsv`;
				await CLI.fs.writeFile(refFileName, seqData);
				const outputFiles = await this.runViralConsensusSingleReference(
					inputFileName,
					sequencesFileName,
					refFileName,
					consenusFileName,
					positionCountsFileName,
					insertionCountsFileName,
					seqHeaderPrefix
				);
				for (const key of Object.keys(outputFiles)) {
					if (outputFiles[key] === undefined) {
						continue;
					}
					if (allFiles[key] === undefined) {
						allFiles[key] = [];
					}
					allFiles[key].push(...outputFiles[key]);
				}
			}
			this.setState({ ...allFiles });
		}
	}

	runViralConsensusSingleReference = async (inputFileName, sequencesFileName, refFileName = DEFAULT_REF_FILE_NAME, consensusFileName = CONSENSUS_FILE_NAME, positionCountsFileName = POSITION_COUNTS_FILE_NAME, insertionCountsFileName = INSERTION_COUNTS_FILE_NAME, seqHeaderPrefix) => {
		const CLI = this.state.CLI;

		if (seqHeaderPrefix) {
			this.log(`Starting consensus job for sequence: ${seqHeaderPrefix}...`)
		} else {
			this.log("Starting consensus job...")
		}

		const primerFileName = DEFAULT_PRIMER_FILE_NAME;

		let command = `viral_consensus -i ${inputFileName} -r ${refFileName} -o ${consensusFileName}`;

		// Handle input read files, run fastp (trimming) and minimap2 (input), as necessary
		this.log("Reading input read file(s)...")
		if (this.state.exampleDataLoaded) {
			await CLI.fs.writeFile(DEFAULT_INPUT_BAM_FILE_NAME, new Uint8Array(this.state.exampleInputFile));
		} else {
			const inputFileData = await this.fileReaderReadFile(this.state.inputFiles[0], true);
			const selectedFileName = this.state.inputFiles[0].name;
			if (selectedFileName.endsWith('.bam') ||
				selectedFileName.endsWith('.sam')) {
				// Handle bam/sam files, don't need to run minimap2 
				const inputFile = await CLI.ls(inputFileName);
				if (!inputFile || inputFile.size === 0) {
					this.log("Recognized input file as BAM/SAM, reading file...")
					await CLI.fs.writeFile(inputFileName, new Uint8Array(inputFileData));
				}
			} else if (this.state.inputFilesAreFASTQ) {
				// Handle fastq files, need to run minimap2
				this.log("Recognized input file(s) as FASTQ, reading file...")

				await CLI.fs.writeFile(inputFileName, new Uint8Array());

				// create the input file (aligned sequences) to be used by ViralConsensus
				const minimap2Command = `minimap2 -t 1 -a -o ${inputFileName} ${refFileName} ${sequencesFileName}`;
				this.log('\n', false);
				this.log('Aligning sequences...')
				this.log('Running command: ' + minimap2Command + '\n')
				const minimap2StartTime = performance.now();
				await CLI.exec(minimap2Command);
				const properRun = (new RegExp(/mapped \d+ sequences/gm)).test(document.getElementById("output-text").value) &&
					!(new RegExp(/failed to parse the FASTA\/FASTQ/gm)).test(document.getElementById("output-text").value);
				const inputFile = await CLI.ls(inputFileName);
				if (!properRun || !inputFile || inputFile.size === 0) {
					throw new Error('minimap2');
				}

				this.log('\n', false);
				this.log(`Minimap2 finished in ${((performance.now() - minimap2StartTime) / 1000).toFixed(3)} seconds`)

			} else {
				// Handle other file types, assuming bam/sam, but giving a warning
				const inputFile = await CLI.ls(inputFileName);
				if (!inputFile || inputFile.size === 0) {
					this.log("WARNING: Input file type not recognized. Assuming bam/sam format.")
					await CLI.fs.writeFile(inputFileName, new Uint8Array(inputFileData));
				}
			}
		}

		// Create example primer file
		if (this.state.primerFile) {
			const primerFileData = await this.fileReaderReadFile(this.state.primerFile, true);
			await CLI.fs.writeFile(primerFileName, new Uint8Array(primerFileData));
			command += ` -p ${primerFileName} -po ${this.state.primerOffset}`;
		}

		// Set parameters
		const minBaseQuality = this.state.minBaseQuality === '' ? this.state.minBaseQualityDefault : this.state.minBaseQuality;
		const minDepth = this.state.minDepth === '' ? this.state.minDepthDefault : this.state.minDepth;
		const minFreq = this.state.minFreq === '' ? this.state.minFreqDefault : this.state.minFreq;
		const ambigSymbol = this.state.ambigSymbol === '' ? this.state.ambigSymbolDefault : this.state.ambigSymbol;
		command += ` -q ${minBaseQuality} -d ${minDepth} -f ${minFreq} -a ${ambigSymbol}`;
		this.setState({ minBaseQuality, minDepth, minFreq, ambigSymbol });

		// Set output files
		if (this.state.genPosCounts) {
			command += ' -op ' + positionCountsFileName;
		}

		if (this.state.genInsCounts) {
			command += ' -oi ' + insertionCountsFileName;
		}

		// Generate consensus genome (run ViralConsensus)
		this.log('\n', false);
		this.log("Running command: " + command + "\n")
		const viralConsensusStartTime = performance.now();
		const commandError = await CLI.exec(command);

		// Error handling
		if (commandError.stderr !== '') {
			throw new Error('ViralConsensus');
		}
		const consensusFile = await CLI.ls(consensusFileName);
		if (!consensusFile || consensusFile.size === 0) {
			this.log("Error: No consensus genome generated. Please check your input files.")
			throw new Error('ViralConsensus');
		}

		this.log(`ViralConsensus finished in ${((performance.now() - viralConsensusStartTime) / 1000).toFixed(3)} seconds`)

		// Check if output files exist
		const posCountsFiles = (await CLI.ls(positionCountsFileName))?.size > 0;
		const insCountsFiles = (await CLI.ls(insertionCountsFileName))?.size > 0;
		const alignedOutputFiles = this.state.inputFilesAreFASTQ && (await CLI.ls(inputFileName))?.size > 0;
		// return output file names
		const outputFiles = {
			consensusFiles: [consensusFileName],
			posCountsFiles: posCountsFiles ? [positionCountsFileName] : undefined,
			insCountsFiles: insCountsFiles ? [insertionCountsFileName] : undefined,
			alignedOutputFiles: alignedOutputFiles ? [inputFileName] : undefined
		}
		return outputFiles;
	}

	trimInput = async (inputFileData) => {
		const CLI = this.state.CLI;
		this.log("Trimming input reads...")
		await CLI.fs.writeFile(TEMP_FASTP_INPUT, new Uint8Array(inputFileData))

		let fastpCommand = `fastp -i ${TEMP_FASTP_INPUT} -o ${TEMP_FASTP_OUTPUT} --json /dev/null --html /dev/null`;

		// Set parameters
		const compressionLevel = this.state.fastpCompressionLevel === '' ? this.state.fastpCompressionLevelDefault : this.state.fastpCompressionLevel;
		fastpCommand += ` --compression ${compressionLevel}`;

		const trimFront1 = this.state.trimFront1 === '' ? this.state.trimFront1Default : this.state.trimFront1;
		fastpCommand += ` --trim_front1 ${trimFront1}`;

		const trimTail1 = this.state.trimTail1 === '' ? this.state.trimTail1Default : this.state.trimTail1;
		fastpCommand += ` --trim_tail1 ${trimTail1}`;

		if (this.state.trimPolyG) {
			fastpCommand += ' --trim_poly_g';
		}

		if (this.state.trimPolyX) {
			fastpCommand += ' --trim_poly_x';
		}

		this.log('\n', false)
		this.log("Running command: " + fastpCommand);
		await CLI.exec(fastpCommand);
		// TODO: Is there a better way to append data w/o an additional read + append? 
		return await CLI.fs.readFile(TEMP_FASTP_OUTPUT);
	}

	// Helper function to read file as text or arraybuffer and promisify
	fileReaderReadFile = async (file, asArrayBuffer = false) => {
		return new Promise((resolve) => {
			const fileReader = new FileReader();
			fileReader.onload = () => {
				resolve(fileReader.result);
			}
			if (asArrayBuffer) {
				fileReader.readAsArrayBuffer(file);
			} else {
				fileReader.readAsText(file);
			}
		})
	}

	// Helper function to read and concatenate multiple files
	fileReaderReadAndMergeFiles = async (files, asArrayBuffer = false) => {
		const fileDataPromises = [];
		for (const file of files) {
			fileDataPromises.push(this.fileReaderReadFile(file, asArrayBuffer));
		}
		const fileData = await Promise.all(fileDataPromises);
		return fileData.join('\n');
	}

	toggleCompressSingle = () => {
		this.setState(prevState => { return { compressSingle: !prevState.compressSingle } });
	}

	toggleDownloadZip = () => {
		this.setState(prevState => { return { downloadZip: !prevState.downloadZip } });
	}

	downloadFiles = async (outputFile, logName) => {
		const CLI = this.state.CLI;

		const files = this.state[outputFile];
		const fileNames = files.map(file => file.split('/').pop());

		let outputFileName = undefined;
		let objectUrl = undefined;
		if (files.length === 1 && !this.state.compressSingle) {
			outputFileName = fileNames[0];
			const fileData = await CLI.fs.readFile(files[0], { encoding: 'binary' });
			objectUrl = URL.createObjectURL(new Blob([fileData], { type: 'application/octet-stream' }));
		} else if (this.state.downloadZip) {
			outputFileName = "viralwasm-consensus-" + outputFile + ".zip";
			const zipWriter = new ZipWriter(new BlobWriter(), { level: 9 });
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				const fileName = fileNames[i];
				const fileData = await CLI.fs.readFile(file, { encoding: 'binary' });
				await zipWriter.add(fileName, new Blob([new Uint8Array(fileData)]).stream());
			}
			const zipBlob = await zipWriter.close();
			objectUrl = URL.createObjectURL(zipBlob);

		} else {
			outputFileName = "viralwasm-consensus-" + outputFile + ".tar.gz";
			const tarWriter = new TarWriter();
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				const fileName = fileNames[i];
				const fileData = await CLI.fs.readFile(file, { encoding: 'binary' });
				tarWriter.addFile(fileName, fileData);
			}
			const tarBlob = await tarWriter.write();
			const tarGzBlob = Pako.gzip(await tarBlob.arrayBuffer());
			objectUrl = URL.createObjectURL(new Blob([tarGzBlob], { type: 'application/octet-stream' }));
		}

		const element = document.createElement("a");
		element.href = objectUrl;
		element.download = outputFileName;
		document.body.appendChild(element);
		element.click();
		document.body.removeChild(element);
		this.log(`Downloaded ${logName} file(s): ${fileNames.join(', ')}`)
	}

	clearFiles = async () => {
		const CLI = this.state.CLI;
		const files = await CLI.ls('./');
		const fileDeletePromises = [];
		for (const file of files) {
			if (file === '.' || file === '..') {
				continue;
			} else {
				fileDeletePromises.push(this.deleteFile(file));
			}
		}
		return Promise.all(fileDeletePromises);
	}

	deleteFile = async (file) => {
		if (!(await this.state.CLI.ls(file))) {
			return;
		}

		await this.state.CLI.fs.truncate(file, 0);
		// await this.state.CLI.fs.unlink(file);
	}

	showOfflineInstructions = (e) => {
		e.preventDefault();
		this.setState({ showOfflineInstructions: true })
	}

	hideOfflineInstructions = () => {
		this.setState({ showOfflineInstructions: false })
	}

	getMemory = async () => {
		try {
			const result = await performance.measureUserAgentSpecificMemory();
			this.setState(prevState => ({ peakMemory: Math.max(result.bytes, prevState.peakMemory) }))
			return result.bytes;
		} catch (error) {
			console.log(error);
		}
	}

	log = (output, extraFormat = true) => {
		const textArea = document.getElementById(OUTPUT_ID);
		const date = new Date();
		textArea.value += (extraFormat ? `${GET_TIME_WITH_MILLISECONDS(date)}: ` : '') + output + (extraFormat ? '\n' : '');
		if (this.state.outputAutoscroll) textArea.scrollTop = textArea.scrollHeight;
	}

	render() {
		return (
			<div className="App pb-5">
				<h2 className="mt-5 mb-2 w-100 text-center">ViralWasm-Consensus</h2>
				<p className="my-3 w-100 text-center">A serverless WebAssembly-based pipeline for consensus genome generation.<br />
					Uses minimap2 v{MINIMAP2_VERSION}, fastp v{FASTP_VERSION}, and ViralConsensus v{VIRAL_CONSENSUS_VERSION} via <a href="https://biowasm.com/" target="_blank" rel="noreferrer">Biowasm</a>. <br />
					<a href="" onClick={this.showOfflineInstructions}>Want to run offline? Click here!</a>
				</p>
				<div className="mt-3" id="container">
					<div id="input" className={`ms-5 me-4 ${this.state.expandedContainer === 'input' && 'full-width-container'} ${this.state.expandedContainer === 'output' && 'd-none'}`}>
						<div id="input-header" className="mb-3">
							<h5 className="my-0">Input</h5>
							<h4 className="my-0">
								<i className={`bi bi-${this.state.expandedContainer === 'input' ? 'arrows-angle-contract' : 'arrows-fullscreen'}`} onClick={() => this.toggleExpandContainer('input')}></i>
							</h4>
						</div>
						<div id="input-content">
							<div className="d-flex flex-column mb-4">
								<label htmlFor="input-files" className="form-label">Select Input Reads File(s) (BAM, SAM, FASTQ(s))<span className="text-danger"> *</span></label>
								<input className={`form-control ${!this.state.inputFilesValid && 'is-invalid'}`} type="file" multiple accept=".sam,.bam,.fastq,.fastq.gz,.fq,.fq.gz,.fas.gz,.fas,.fa,.fa.gz,.fasta,.fasta.gz" id="input-files" data-testid="input-files" onChange={this.selectInputFiles} />
								{this.state.exampleDataLoaded &&
									<p className="mt-2 mb-0"><strong>Using Loaded Example file: <a
										href={`${import.meta.env.BASE_URL || ''}${EXAMPLE_INPUT_FILE}`}
										target="_blank" rel="noreferrer">example.bam</a></strong></p>
								}
							</div>

							{/* NOTE: we assume here that if they select more than one file, they are intending to select multiple FASTQ files */}
							{this.state.inputFiles?.length > 0 &&
								<div id="input-files-list" className={`d-flex flex-column mb-4`}>
									<p>Selected Input Reads Files (If multiple files, must all be FASTQ):</p>
									<ul className="list-group">
										{this.state.inputFiles.map((file, i) => {
											const validFile = !ARE_FASTQ([file]) && this.state.inputFiles.length !== 1;
											return (
												<li key={i} className={`list-group-item d-flex justify-content-between ${validFile && 'text-danger'}`}>
													<div>
														{file.name}
													</div>
													<div>
														<i className="bi bi-trash text-danger cursor-pointer" onClick={() => this.deleteInputFile(i)}></i>
														{validFile &&
															<i className="bi bi-exclamation-circle ms-3"></i>
														}
													</div>
												</li>
											)
										})}
									</ul>
									<button className="btn btn-danger mt-3" onClick={this.clearInputFiles}>Clear Input Reads Files</button>
								</div>
							}

							<div className={`${this.state.refFiles !== undefined ? 'disabled-input' : ''}`}>
								<label htmlFor="common-sequences" className="form-label mt-4">
									Select Preloaded Reference Sequence
								</label>
								<select className={`form-select  ${!this.state.refFilesValid && 'is-invalid'}`} aria-label="Default select example" id="common-sequences" value={this.state.preloadedRef ?? ''} onChange={this.setPreloadedRef}>
									<option value="">Select a Reference Sequence</option>
									{this.state.preloadRefOptions}
								</select>
							</div>

							<h5 className="mt-1 mb-0 text-center">&#8213; OR &#8213;</h5>

							<div className="d-flex flex-column mb-4">
								<label htmlFor="reference-file" className="form-label">Reference File (FASTA)<span className="text-danger"> *</span></label>
								<div className="input-group">
									<input className={`form-control ${!this.state.refFilesValid && 'is-invalid'}`} type="file" multiple id="reference-file" data-testid="reference-file" onChange={this.selectRefFiles} />
									<button className="btn btn-outline-danger" type="button" id="reference-file-addon" onClick={this.clearRefFiles}><i className="bi bi-trash"></i></button>
								</div>
							</div>

							{/* NOTE: we assume here that if they select more than one file, they are intending to select multiple FASTQ files */}
							{this.state.refFiles?.length > 0 &&
								<div id="input-files-list" className={`d-flex flex-column mb-4`}>
									<p>Selected Reference Files:</p>
									<ul className="list-group">
										{this.state.refFiles.map((file, i) => {
											return (
												<li key={i} className={`list-group-item d-flex justify-content-between`}>
													<div>
														{file.name}
													</div>
													<div>
														<i className="bi bi-trash text-danger cursor-pointer" onClick={() => this.deleteRefFile(i)}></i>
													</div>
												</li>
											)
										})}
									</ul>
									<button className="btn btn-danger mt-3" onClick={this.clearInputFiles}>Clear Reference Files</button>
								</div>
							}

							<div className='form-check mt-5 mb-2' style={{ opacity: this.state.inputFilesAreFASTQ ? 1 : 0.5 }}>
								<label className="form-check-label" htmlFor="trim-input-fastq">
									Trim Input FASTQ Sequences
								</label>
								<input className="form-check-input" type="checkbox" name="trim-input-fastq" id="trim-input-fastq" data-testid="trim-input-fastq" checked={this.state.trimInput} onChange={this.setTrimInput} disabled={!this.state.inputFilesAreFASTQ} />
							</div>

							<h6 className={`mt-4 ${this.state.trimInput ? '' : 'disabled'}`} id="fastp-arguments">Fastp Trim Arguments <i className={`bi bi-chevron-${this.state.trimInput ? 'up' : 'down'}`}></i></h6>
							<hr></hr>

							<div className={`${this.state.trimInput ? '' : 'd-none'}`}>
								<label htmlFor="fastp-compression-level" className="form-label">Compression Level (1-9)</label>
								<input id="fastp-compression-level" className={`form-control ${!this.state.fastpCompressionLevelValid && 'is-invalid'}`} type="number" placeholder="Compression Level" value={this.state.fastpCompressionLevel} onChange={this.setFastpCompressionLevel} />
								<div className="form-text mb-4">Compression level for gzip output (1-9). 1 is fastest, 9 is smallest (default: {this.state.fastpCompressionLevelDefault})</div>

								<label htmlFor="trim-front-1" className="form-label"># of Bases to Trim (Front)</label>
								<input id="trim-front-1" data-testid="trim-front-1" className={`form-control ${!this.state.trimFront1Valid && 'is-invalid'}`} type="number" placeholder="# of Bases to Trim (Front)" value={this.state.trimFront1} onChange={this.setTrimFront1} />
								<div className="form-text mb-4">Number of bases to trim in the front of every read (default: {this.state.trimFront1Default})</div>

								<label htmlFor="trim-tail-1" className="form-label"># of Bases to Trim (Tail)</label>
								<input id="trim-tail-1" data-testid="trim-tail-1" className={`form-control ${!this.state.trimTail1Valid && 'is-invalid'}`} type="number" placeholder="# of Bases to Trim (Tail)" value={this.state.trimTail1} onChange={this.setTrimTail1} />
								<div className="form-text mb-4">Number of bases to trim in the tail of every read (default: {this.state.trimTail1Default})</div>

								<div className="form-check mb-4">
									<label className="form-check-label" htmlFor="trim-poly-g">
										Force PolyG Tail Trimming <span style={{ fontSize: '0.75rem' }}>(automatically enabled for Illumina NextSeq/NovaSeq data)</span>
									</label>
									<input className="form-check-input" type="checkbox" name="trim-poly-g" id="trim-poly-g" checked={this.state.trimPolyG} onChange={this.setTrimPolyG} />
								</div>
								<div className="form-check mb-4">
									<label className="form-check-label" htmlFor="trim-poly-x">
										Enable PolyX Trimming in 3&apos; Ends.
									</label>
									<input className="form-check-input" type="checkbox" name="trim-poly-x" id="trim-poly-x" checked={this.state.trimPolyX} onChange={this.setTrimPolyX} />
								</div>
							</div>

							<h6 className="mt-5" id="additional-arguments" onClick={() => this.toggleAdditionalArgs()}>ViralConsensus Additional Arguments <i className={`bi bi-chevron-${this.state.additionalArgsOpen ? 'up' : 'down'}`}></i></h6>
							<hr></hr>

							<div className={`${this.state.additionalArgsOpen ? '' : 'd-none'}`}>

								<div className="d-flex flex-column mb-4">
									<label htmlFor="primer-file" className="form-label">Primer (BED) File</label>
									<input className="form-control" type="file" id="primer-file" onChange={this.selectPrimerFile} />
								</div>

								<label htmlFor="min-base-quality" className="form-label">Primer Offset</label>
								<input id="primer-offset" className={`form-control ${!this.state.primerOffsetValid && 'is-invalid'}`} type="number" placeholder="Primer Offset" value={this.state.primerOffset} onChange={this.setPrimerOffset} />
								<div className="form-text mb-4">Number of bases after primer to also trim (default: {this.state.primerOffsetDefault})</div>

								<label htmlFor="min-base-quality" className="form-label">Minimum Base Quality</label>
								<input id="min-base-quality" className={`form-control ${!this.state.minBaseQualityValid && 'is-invalid'}`} type="number" placeholder="Minimum Base Quality" value={this.state.minBaseQuality} onChange={this.setMinBaseQuality} />
								<div className="form-text mb-4">Min. base quality to count base in counts (default: {this.state.minBaseQualityDefault})</div>

								<label htmlFor="min-depth" className="form-label">Minimum Depth</label>
								<input id="min-depth" className={`form-control ${!this.state.minDepthValid && 'is-invalid'}`} type="number" placeholder="Minimum Depth" value={this.state.minDepth} onChange={this.setMinDepth} />
								<div className="form-text mb-4">Min. depth to call base in consensus (default: {this.state.minDepthDefault})</div>

								<label htmlFor="min-freq" className="form-label">Minimum Frequency</label>
								<input id="min-freq" className={`form-control ${!this.state.minFreqValid && 'is-invalid'}`} type="number" placeholder="Minimum Frequency" value={this.state.minFreq} onChange={this.setMinFreq} />
								<div className="form-text mb-4">Min. frequency to call base/insertion in consensus (default: {this.state.minFreqDefault})</div>

								<label htmlFor="ambig-symbol" className="form-label">Ambiguous Symbol</label>
								<input id="ambig-symbol" className={`form-control ${!this.state.ambigSymbolValid && 'is-invalid'}`} type="text" placeholder="Ambiguous Symbol" value={this.state.ambigSymbol} onChange={this.setAmbigSymbol} />
								<div className="form-text mb-4">Symbol to use for ambiguous bases (default: {this.state.ambigSymbolDefault})</div>

								<div className="form-check mb-4">
									<label className="form-check-label" htmlFor="output-pos-counts">
										Generate Position Counts
									</label>
									<input className="form-check-input" type="checkbox" name="output-pos-counts" id="output-pos-counts" checked={this.state.genPosCounts} onChange={this.setGenPosCounts} />
								</div>
								<div className="form-check">
									<label className="form-check-label" htmlFor="output-ins-counts">
										Generate Insertion Counts
									</label>
									<input className="form-check-input" type="checkbox" name="output-ins-counts" id="output-ins-counts" checked={this.state.genInsCounts} onChange={this.setGenInsCounts} />
								</div>
							</div>
						</div>

						<button type="button" className="mt-3 btn btn-danger w-100" onClick={this.promptResetInput}>Reset Input</button>
						<button type="button" className={`w-100 btn btn-${this.state.exampleDataLoaded ? 'success' : 'warning'} mt-3`} onClick={this.toggleLoadExampleData} data-testid="load-example-data">
							Load Example Data {this.state.exampleDataLoaded && <strong>(Currently Using Example Files!)</strong>}
						</button>

						<button type="button" className="btn btn-primary w-100 mt-3" onClick={this.run} data-testid='run'>Run ViralWasm-Consensus</button>
					</div>

					<div id="output" className={`form-group ms-4 me-5 ${this.state.expandedContainer === 'output' && 'full-width-container'} ${this.state.expandedContainer === 'input' && 'd-none'}`}>
						<div id="output-header" className="mb-3">
							<label htmlFor="output-text"><h5 className="my-0">Console</h5></label>
							<h4 className="my-0">
								<i className={`bi bi-${this.state.expandedContainer === 'output' ? 'arrows-angle-contract' : 'arrows-fullscreen'}`} onClick={() => this.toggleExpandContainer('output')}></i>
							</h4>
						</div>
						<textarea className="form-control" id="output-text" data-testid="output-text" rows="3" disabled></textarea>
						<div className="form-check my-3">
							<input className="form-check-input mt-1" type="checkbox" id="output-autoscroll" checked={this.state.outputAutoscroll} onChange={this.toggleOutputAutoscroll} />
							<label className="form-check-label ms-1" htmlFor="output-autoscroll">
								Autoscroll with output
							</label>
						</div>
						{this.state.loading && <img id="loading" className="mt-3" src={loading} />}
						{this.state.errorMessage && <div className="text-danger text-center mt-3">{this.state.errorMessage}</div>}
						{(this.state.done && (this.state.consensusFiles || this.state.posCountsFiles || this.state.insCountsFiles) &&
							<div>
								<p className="mt-4 mb-2">ViralConsensus Output Files: </p>
								<div className="form-check mt-2">
									<input className="form-check-input" type="checkbox" id="compress-single-file" checked={this.state.compressSingle} onChange={this.toggleCompressSingle} />
									<label className="form-check-label" htmlFor="compress-single-file">Compress single-file outputs</label>
								</div>
								<div className="form-check mt-2 mb-3">
									<input className="form-check-input" type="checkbox" id="download-zip" checked={this.state.downloadZip} onChange={this.toggleDownloadZip} />
									<label className="form-check-label" htmlFor="download-zip">ZIP output (Default: GZIP)</label>
								</div>
							</div>
						)}
						<div className="download-buttons">
							{(this.state.done && this.state.consensusFiles) &&
								<button type="button" className={`btn btn-primary mx-2 w-100`} onClick={() => this.downloadFiles('consensusFiles', 'consensus')}>
									Download Consensus FASTA {this.state.consensusFiles.length > 1 && `(${this.state.consensusFiles.length} files)`}
								</button>
							}
							{(this.state.done && this.state.posCountsFiles) &&
								<button type="button" className={`btn btn-primary mx-2 w-100`} onClick={() => this.downloadFiles('posCountsFiles', 'position counts')}>
									Download Position Counts {this.state.posCountsFiles.length > 1 && `(${this.state.posCountsFiles.length} files)`}
								</button>
							}
							{(this.state.done && this.state.insCountsFiles) &&
								<button type="button" className={`btn btn-primary mx-2 w-100`} onClick={() => this.downloadFiles('insCountsFiles', 'insertion counts')}>
									Download Insertion Counts {this.state.insCountsFiles.length > 1 && `(${this.state.insCountsFiles.length} files)`}
								</button>
							}
						</div>
						{(this.state.done && (this.state.trimmedOutputFiles || this.state.alignedOutputFiles) &&
							<p className="mt-3 mb-2">Other Output Files:</p>)}
						<div className="download-buttons">
							{(this.state.done && this.state.trimmedOutputFiles) &&
								<button type="button" className={`btn btn-primary mx-2 w-100`} onClick={() => this.downloadFiles('trimmedOutputFiles', 'trimmed sequences')}>
									Download Trimmed Sequences (FASTP)
								</button>
							}
							{(this.state.done && this.state.alignedOutputFiles) &&
								<button type="button" className={`btn btn-primary mx-2 w-100`} onClick={() => this.downloadFiles('alignedOutputFiles', 'aligned sequences')}>
									Download Aligned Sequences (Minimap2) {this.state.alignedOutputFiles.length > 1 && `(${this.state.alignedOutputFiles.length} files)`}
								</button>
							}
						</div>
						<div id="duration" className="my-3">
							{this.state.timeElapsed &&
								<p id="duration-text" data-testid="duration-text">Total runtime: {this.state.timeElapsed} seconds</p>
							}
							{this.state.running && !this.state.done &&
								<React.Fragment>
									Running ... &nbsp;
									<img id="running-loading-circle" className="loading-circle ms-2"
										alt="loading" />
								</React.Fragment>
							}
						</div>
						{this.state.done && this.state.inputChanged && <p className="text-warning text-center">Warning: Form input has changed since last run, run again to download latest output files.</p>}
					</div>
				</div>
				<footer className="w-100 text-center px-5">
					Source code:&nbsp;<a href="https://github.com/niema-lab/ViralWasm-Consensus/" target="_blank" rel="noreferrer">github.com/niema-lab/ViralWasm-Consensus</a>.
					<br /><br />
					<span>Citation: Ji D, Aboukhalil R, Moshiri N (2023). &quot;ViralWasm: a client-side user-friendly web application suite for viral genomics.&quot; <i>Bioinformatics</i>. btae018. <a href="https://doi.org/10.1093/bioinformatics/btae018" target="_blank" rel="noreferrer">doi:10.1093/bioinformatics/btae018</a></span>
					<br />
				</footer>

				{
					this.state.showOfflineInstructions &&
					<div id="offline-instructions">
						<div className="card">
							<button type="button" className="btn-close" aria-label="Close" onClick={this.hideOfflineInstructions}></button>
							<div className="card-body">
								<h5 className="card-title text-center mt-3 mb-4">Running ViralWasm-Consensus Offline</h5>
								<div dangerouslySetInnerHTML={{ __html: this.state.offlineInstructions }} />
							</div>
						</div>
					</div>
				}
			</div >
		)
	}
}

export default App
