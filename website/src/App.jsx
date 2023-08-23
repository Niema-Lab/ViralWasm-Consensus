import React, { Component } from 'react'
import Pako from 'pako';

import {
	CLEAR_LOG,
	LOG,
	EXAMPLE_ALIGNMENT_FILE,
	DEFAULT_ALIGNMENT_BAM_FILE_NAME,
	DEFAULT_ALIGNMENT_SAM_FILE_NAME,
	TEMP_FASTP_INPUT,
	TEMP_FASTP_OUTPUT,
	COMBINED_SEQUENCES_FILE_NAME,
	FASTP_OUTPUT_FILE_NAME,
	MINIMAP_OUTPUT_FILE_NAME,
	EXAMPLE_REF_FILE,
	DEFAULT_REF_FILE_NAME,
	DEFAULT_PRIMER_FILE_NAME,
	DEFAULT_VALS_FILE,
	DEFAULT_VALS_MAPPING,
	ARE_FASTQ,
	IS_GZIP,
	INPUT_IS_NONNEG_INTEGER,
	INSERTION_COUNTS_FILE_NAME,
	POSITION_COUNTS_FILE_NAME,
	CONSENSUS_FILE_NAME,
	DEFAULT_INPUT_STATE
} from './constants'

import './App.scss'

import loading from './assets/loading.png'

export class App extends Component {
	constructor(props) {
		super(props)

		this.state = {
			version: '',

			expandedContainer: undefined,
			additionalArgsOpen: false,

			exampleAlignmentFile: undefined,
			exampleRefFile: undefined,

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
			consensusExists: false,
			posCountsExists: false,
			insCountsExists: false,
			fastpOutputExists: false,
			minimapOutputExists: false,
			loading: false,
			inputChanged: false
		}
	}

	async componentDidMount() {
		this.setState({
			CLI: await new Aioli(["ViralConsensus/viral_consensus/0.0.3", "minimap2/2.22", "fastp/0.20.1"], {
				printInterleaved: false,
			})
		}, () => {
			CLEAR_LOG()
			LOG("ViralConsensus Online Tool loaded.")
		})

		this.preventNumberInputScrolling();
		this.fetchExampleFiles();
		this.loadDefaultsAndVersion();
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
		const exampleRefFile = await (await fetch(EXAMPLE_REF_FILE)).text();
		const exampleAlignmentFile = await (await fetch(EXAMPLE_ALIGNMENT_FILE)).arrayBuffer();

		this.setState({ exampleRefFile, exampleAlignmentFile: exampleAlignmentFile })
	}

	// Fetch and load ViralConsensus default values and version 
	loadDefaultsAndVersion = async () => {
		const defaultTextFile = await (await fetch(DEFAULT_VALS_FILE)).text();
		const defaultText = [...defaultTextFile.matchAll(/#define DEFAULT.*$/gm)].map((line) => line[0].split(' '));
		for (const defaultValue of defaultText) {
			if (DEFAULT_VALS_MAPPING[defaultValue[1]]) {
				if (isNaN(defaultValue[2])) {
					defaultValue[2] = defaultValue[2].replace(/"|'/g, '');
				} else {
					defaultValue[2] = Number(defaultValue[2]);
				}
				this.setState({ [DEFAULT_VALS_MAPPING[defaultValue[1]] + "Default"]: defaultValue[2], [DEFAULT_VALS_MAPPING[defaultValue[1]]]: defaultValue[2] })
			}
		}

		const version = 'v' + defaultTextFile.matchAll(/#define VERSION.*$/gm).next().value[0].split(' ')[2].replace(/"|'/g, '');
		this.setState({ version })
	}

	uploadRefFile = (e) => {
		this.setState({ refFile: e.target.files[0], refFileValid: true, inputChanged: true })
	}

	uploadAlignmentFiles = (e) => {
		const currentAlignmentFiles = this.state.alignmentFiles === 'EXAMPLE_DATA' ? [] : this.state.alignmentFiles;
		const alignmentFiles = [...(currentAlignmentFiles || []), ...Array.from(e.target.files)];
		this.setState({
			alignmentFiles: alignmentFiles,
			alignmentFilesValid: this.validAlignmentFiles(alignmentFiles),
			inputChanged: true,
			alignmentFilesAreFASTQ: ARE_FASTQ(alignmentFiles),
		}, () => {
			if (alignmentFiles.length > 1) {
				document.getElementById('alignment-files').value = null;
			}
		})
	}

	validAlignmentFiles = (files) => {
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

	clearAlignmentFiles = () => {
		this.setState({
			alignmentFiles: undefined,
			alignmentFilesValid: true,
			inputChanged: true,
			alignmentFilesAreFASTQ: false,
		})
		document.getElementById('alignment-files').value = null;
	}

	deleteAlignmentFile = (index) => {
		document.getElementById("alignment-files").value = null;

		const alignmentFiles = [...this.state.alignmentFiles];
		alignmentFiles.splice(index, 1);

		const alignmentFilesValid = this.validAlignmentFiles(alignmentFiles);
		const alignmentFilesAreFASTQ = ARE_FASTQ(alignmentFiles);
		this.setState({ alignmentFiles, alignmentFilesValid, alignmentFilesAreFASTQ, inputChanged: true })
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

	uploadPrimerFile = (e) => {
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

	toggleFastpArguments = (open = undefined) => {
		if (this.state.trimInput) {
			this.setState(prevState => {
				return { fastpOpen: open === undefined ? !prevState.fastpOpen : open }
			})
		}
	}

	toggleLoadExampleData = () => {
		this.setState(prevState => {
			const refFile = (prevState.refFile === 'EXAMPLE_DATA' || prevState.alignmentFiles === 'EXAMPLE_DATA') ? document.getElementById('reference-file')?.files[0] : 'EXAMPLE_DATA';
			const alignmentFiles = (prevState.refFile === 'EXAMPLE_DATA' || prevState.alignmentFiles === 'EXAMPLE_DATA') ? Array.from(document.getElementById('alignment-files')?.files) : 'EXAMPLE_DATA';
			const alignmentFilesAreFASTQ = (alignmentFiles === 'EXAMPLE_DATA') ? false : ARE_FASTQ(Array.from(document.getElementById('alignment-files').files));
			return {
				refFile,
				alignmentFiles,
				alignmentFilesAreFASTQ,
				refFileValid: true,
				alignmentFilesValid: true,
				inputChanged: prevState.refFile !== refFile || prevState.alignmentFiles !== alignmentFiles
			}
		})
	}

	toggleExpandContainer = (container) => {
		this.setState(prevState => {
			return { expandedContainer: prevState.expandedContainer === container ? undefined : container }
		});
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
		document.getElementById('alignment-files').value = null;
		document.getElementById('primer-file').value = null;
	}

	validInput = () => {
		let valid = true;
		let refFileValid = true;
		let alignmentFilesValid = true;
		// Note: Other input validation is done in the setters

		CLEAR_LOG()
		LOG("Validating input...")

		if (!this.state.refFile) {
			refFileValid = false;
		}

		if (this.state.alignmentFiles !== 'EXAMPLE_DATA' && !this.validAlignmentFiles(this.state.alignmentFiles)) {
			alignmentFilesValid = false;
		}

		valid = refFileValid && alignmentFilesValid &&
			this.state.primerOffsetValid &&
			this.state.minBaseQualityValid &&
			this.state.minDepthValid &&
			this.state.minFreqValid &&
			this.state.ambigSymbolValid &&
			this.state.trimFront1Valid &&
			this.state.trimTail1Valid &&
			this.state.fastpCompressionLevelValid;

		this.setState({ refFileValid, alignmentFilesValid })

		return valid;
	}

	runViralConsensus = async () => {
		if (!this.validInput()) {
			alert("Invalid input. Please check your input and try again.")
			LOG("Invalid input. Please check your input and try again.")
			return;
		}

		const startTime = performance.now();
		LOG("Starting job...")
		this.setState({ done: false, loading: true, inputChanged: false, consensusExists: false, posCountsExists: false, insCountsExists: false, fastpOutputExists: false, minimapOutputExists: false })

		const CLI = this.state.CLI;

		if (CLI === undefined) {
			setTimeout(() => {
				this.runViralConsensus();
			}, 2000)
			return;
		}

		const refFileName = DEFAULT_REF_FILE_NAME;
		const alignmentFileName = (this.state.alignmentFiles[0]?.name?.endsWith('.bam') || this.state.alignmentFiles === 'EXAMPLE_DATA') ?
			DEFAULT_ALIGNMENT_BAM_FILE_NAME : DEFAULT_ALIGNMENT_SAM_FILE_NAME;
		const primerFileName = DEFAULT_PRIMER_FILE_NAME;

		let command = `viral_consensus -i ${this.state.alignmentFilesAreFASTQ ? MINIMAP_OUTPUT_FILE_NAME : alignmentFileName} -r ${refFileName} -o ${CONSENSUS_FILE_NAME}`;

		// Delete old files
		LOG("Deleting old files...")
		await this.clearFiles();

		LOG("Reading reference file...")
		// Create example reference fasta file
		if (this.state.refFile === 'EXAMPLE_DATA') {
			await CLI.fs.writeFile(DEFAULT_REF_FILE_NAME, this.state.exampleRefFile);
		} else {
			await CLI.fs.writeFile(DEFAULT_REF_FILE_NAME, await this.fileReaderReadFile(this.state.refFile));
		}

		// Handle input read files, run fastp (trimming) and minimap2 (alignment), as necessary
		LOG("Reading input read file(s)...")
		if (this.state.alignmentFiles === 'EXAMPLE_DATA') {
			await CLI.fs.writeFile(DEFAULT_ALIGNMENT_BAM_FILE_NAME, new Uint8Array(this.state.exampleAlignmentFile));
		} else {
			const alignmentFileData = await this.fileReaderReadFile(this.state.alignmentFiles[0], true);
			const uploadedFileName = this.state.alignmentFiles[0].name;
			if (uploadedFileName.endsWith('.bam') ||
				uploadedFileName.endsWith('.sam')) {
				// Handle bam/sam files, don't need to run minimap2 
				LOG("Recognized alignment file as BAM/SAM, reading file...")
				await CLI.fs.writeFile(alignmentFileName, new Uint8Array(alignmentFileData));
			} else if (this.state.alignmentFilesAreFASTQ) {
				// Handle fastq files, need to run minimap2 (already handled in the declaration of command)
				LOG("Recognized alignment file(s) as FASTQ, reading file...")
				const sequencesFile = this.state.trimInput ? FASTP_OUTPUT_FILE_NAME : COMBINED_SEQUENCES_FILE_NAME;

				// Add additional alignment files (fastq files)
				for (let i = 0; i < this.state.alignmentFiles.length; i++) {
					const alignmentFile = this.state.alignmentFiles[i];
					let alignmentFileData = await this.fileReaderReadFile(alignmentFile, true);
					if (!IS_GZIP(alignmentFileData)) {
						LOG("Gzipping uploaded alignment file " + alignmentFile.name + " before running minimap2...")
						alignmentFileData = Pako.gzip(alignmentFileData);
					} else {
						LOG("Alignment file " + alignmentFile.name + " is already gzipped, skipping gzip...")
					}
					if (this.state.trimInput) {
						alignmentFileData = await this.trimInput(alignmentFileData)
					}
					await CLI.fs.writeFile(sequencesFile, new Uint8Array(alignmentFileData), { flags: 'a' });
				}
				await this.deleteFile(TEMP_FASTP_INPUT);
				await this.deleteFile(TEMP_FASTP_OUTPUT);

				await CLI.fs.writeFile(MINIMAP_OUTPUT_FILE_NAME, new Uint8Array());
				const minimapCommand = `minimap2 -t 1 -a -o ${MINIMAP_OUTPUT_FILE_NAME} ${refFileName} ${sequencesFile}`;
				LOG("Executing command: " + minimapCommand);
				await CLI.exec(minimapCommand);
			} else {
				// Handle other file types, assuming bam/sam, but giving a warning
				LOG("WARNING: Alignment file extension not recognized. Assuming bam/sam format.")
				await CLI.fs.writeFile(alignmentFileName, new Uint8Array(alignmentFileData));
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
			command += ' -op ' + POSITION_COUNTS_FILE_NAME;
		}

		if (this.state.genInsCounts) {
			command += ' -oi ' + INSERTION_COUNTS_FILE_NAME;
		}

		// Generate consensus genome (run viral_consensus)
		LOG("Executing command: " + command)
		const commandError = await CLI.exec(command);

		// Error handling
		if (commandError.stderr !== '') {
			console.log(commandError)
			LOG("Error: " + commandError.stderr);
			this.setState({ loading: false })
			return;
		}
		const consensusFile = await CLI.ls(CONSENSUS_FILE_NAME);
		if (!consensusFile || consensusFile.size === 0) {
			LOG("Error: No consensus genome generated. Please check your input files.")
			this.setState({ loading: false })
			return;
		}

		// Check if output files exist
		const consensusExists = !!consensusFile;
		const posCountsExists = !!(await CLI.ls(POSITION_COUNTS_FILE_NAME));
		const insCountsExists = !!(await CLI.ls(INSERTION_COUNTS_FILE_NAME));
		const fastpOutputExists = !!(await CLI.ls(FASTP_OUTPUT_FILE_NAME));
		const minimapOutputExists = !!(await CLI.ls(MINIMAP_OUTPUT_FILE_NAME));
		this.setState({ done: true, consensusExists, posCountsExists, insCountsExists, fastpOutputExists, minimapOutputExists, loading: false })
		LOG(`Done! Time Elapsed: ${((performance.now() - startTime) / 1000).toFixed(3)} seconds`);
	}

	trimInput = async (alignmentFileData) => {
		const CLI = this.state.CLI;
		LOG("Trimming input reads...")
		await CLI.fs.writeFile(TEMP_FASTP_INPUT, new Uint8Array(alignmentFileData))

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

		LOG("Executing command: " + fastpCommand);
		await CLI.exec(fastpCommand);
		// TODO: Is there a better way to append data w/o an additional read + append? 
		return await CLI.fs.readFile(TEMP_FASTP_OUTPUT);
	}

	// Helper function to read file as text or arraybuffer and promisify
	fileReaderReadFile = async (file, asArrayBuffer = false) => {
		return new Promise((resolve, reject) => {
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

	downloadFile = async (fileName) => {
		const CLI = this.state.CLI;
		if (!(await CLI.ls(fileName))) {
			return;
		}

		// remove absolute path from file name
		fileName = fileName.split('/').pop();

		const fileBlob = new Blob([await CLI.fs.readFile(fileName, { encoding: 'binary' })], { type: 'application/octet-stream' });
		var objectUrl = URL.createObjectURL(fileBlob);

		const element = document.createElement("a");
		element.href = objectUrl;
		element.download = fileName;
		document.body.appendChild(element);
		element.click();
		document.body.removeChild(element);

		LOG(`Downloaded ${fileName}`)
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
		await this.state.CLI.fs.unlink(file);
	}

	render() {
		return (
			<div className="App pb-5">
				<h2 className="mt-5 mb-2 w-100 text-center">ViralWasm-Consensus {this.state.version}</h2>
				<p className="my-3 w-100 text-center">A serverless WebAssembly-based pipeline for consensus genome generation. Uses minimap2, fastp, and ViralConsensus via <a href="https://biowasm.com/" target="_blank" rel="noreferrer">Biowasm</a>. <br /><br /></p>
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
								<label htmlFor="reference-file" className="form-label">Reference File (FASTA){this.state.refFile === 'EXAMPLE_DATA' && <span><strong>: Using example <a href={EXAMPLE_REF_FILE} target="_blank" rel="noreferrer">reference file</a>.</strong></span>}<span className="text-danger"> *</span></label>
								<input className={`form-control ${!this.state.refFileValid && 'is-invalid'}`} type="file" id="reference-file" onChange={this.uploadRefFile} />
							</div>

							<div className="d-flex flex-column mb-4">
								<label htmlFor="alignment-files" className="form-label">Upload Input Reads File(s) (BAM, SAM, FASTQ(s)){this.state.alignmentFiles === 'EXAMPLE_DATA' && <span><strong>: Using example <a href={EXAMPLE_ALIGNMENT_FILE} target="_blank" rel="noreferrer">BAM file</a>.</strong></span>}<span className="text-danger"> *</span></label>
								<input className={`form-control ${!this.state.alignmentFilesValid && 'is-invalid'}`} type="file" multiple accept=".sam,.bam,.fastq,.fastq.gz,.fq,.fq.gz" id="alignment-files" onChange={this.uploadAlignmentFiles} />
							</div>

							{/* NOTE: we assume here that if they upload more than one file, they are intending to upload multiple FASTQ files */}
							{typeof this.state.alignmentFiles === 'object' && this.state.alignmentFiles.length > 0 &&
								<div id="alignment-files-list" className={`d-flex flex-column mb-4`}>
									<p>Uploaded Input Reads Files (If multiple files, must all be FASTQ):</p>
									<ul className="list-group">
										{this.state.alignmentFiles.map((file, i) => {
											const validFile = !ARE_FASTQ([file]) && this.state.alignmentFiles.length !== 1;
											return (
												<li key={i} className={`list-group-item d-flex justify-content-between ${validFile && 'text-danger'}`}>
													<div>
														{file.name}
													</div>
													<div>
														<i className="bi bi-trash text-danger cursor-pointer" onClick={() => this.deleteAlignmentFile(i)}></i>
														{validFile &&
															<i className="bi bi-exclamation-circle ms-3"></i>
														}
													</div>
												</li>
											)
										})}
									</ul>
									<button className="btn btn-danger mt-3" onClick={this.clearAlignmentFiles}>Clear Input Reads Files</button>
								</div>
							}

							<div className='form-check mb-4' style={{ opacity: (typeof this.state.alignmentFiles === 'object' && (this.state.alignmentFiles.length > 1 || this.state.alignmentFilesAreFASTQ)) ? 1 : 0.5 }}>
								<label className="form-check-label" htmlFor="trim-input-fastq">
									Trim Input FASTQ Sequences
								</label>
								<input className="form-check-input" type="checkbox" name="trim-input-fastq" id="trim-input-fastq" checked={this.state.trimInput} onChange={this.setTrimInput} disabled={!(typeof this.state.alignmentFiles === 'object' && (this.state.alignmentFiles.length > 1 || this.state.alignmentFilesAreFASTQ))} />
							</div>

							<h6 className={`mt-5 ${this.state.trimInput ? '' : 'disabled'}`} id="fastp-arguments" onClick={() => this.toggleFastpArguments()}>Fastp Trim Arguments <i className={`bi bi-chevron-${this.state.fastpOpen ? 'up' : 'down'}`}></i></h6>
							<hr></hr>

							<div className={`${this.state.fastpOpen ? '' : 'd-none'}`}>
								<label htmlFor="fastp-compression-level" className="form-label">Compression Level (1-9)</label>
								<input id="fastp-compression-level" className={`form-control ${!this.state.fastpCompressionLevelValid && 'is-invalid'}`} type="number" placeholder="Compression Level" value={this.state.fastpCompressionLevel} onChange={this.setFastpCompressionLevel} />
								<div className="form-text mb-4">Compression level for gzip output (1-9). 1 is fastest, 9 is smallest (default: {this.state.fastpCompressionLevelDefault})</div>

								<label htmlFor="trim-front-1" className="form-label"># of Bases to Trim (Front)</label>
								<input id="trim-front-1" className={`form-control ${!this.state.trimFront1Valid && 'is-invalid'}`} type="number" placeholder="# of Bases to Trim (Front)" value={this.state.trimFront1} onChange={this.setTrimFront1} />
								<div className="form-text mb-4">Number of bases to trim in the front of every read (default: {this.state.trimFront1Default})</div>

								<label htmlFor="trim-tail-1" className="form-label"># of Bases to Trim (Tail)</label>
								<input id="trim-tail-1" className={`form-control ${!this.state.trimTail1Valid && 'is-invalid'}`} type="number" placeholder="# of Bases to Trim (Tail)" value={this.state.trimTail1} onChange={this.setTrimTail1} />
								<div className="form-text mb-4">Number of bases to trim in the tail of every read (default: {this.state.trimTail1Default})</div>

								<div className="form-check mb-4">
									<label className="form-check-label" htmlFor="trim-poly-g">
										Force PolyG Tail Trimming <span style={{ fontSize: '0.75rem' }}>(automatically enabled for Illumina NextSeq/NovaSeq data)</span>
									</label>
									<input className="form-check-input" type="checkbox" name="trim-poly-g" id="trim-poly-g" checked={this.state.trimPolyG} onChange={this.setTrimPolyG} />
								</div>
								<div className="form-check mb-4">
									<label className="form-check-label" htmlFor="trim-poly-x">
										Enable PolyX Trimming in 3' Ends.
									</label>
									<input className="form-check-input" type="checkbox" name="trim-poly-x" id="trim-poly-x" checked={this.state.trimPolyX} onChange={this.setTrimPolyX} />
								</div>
							</div>

							<h6 className="mt-5" id="additional-arguments" onClick={() => this.toggleAdditionalArgs()}>ViralConsensus Additional Arguments <i className={`bi bi-chevron-${this.state.tn93Open ? 'up' : 'down'}`}></i></h6>
							<hr></hr>

							<div className={`${this.state.additionalArgsOpen ? '' : 'd-none'}`}>

								<div className="d-flex flex-column mb-4">
									<label htmlFor="primer-file" className="form-label">Primer (BED) File</label>
									<input className="form-control" type="file" id="primer-file" onChange={this.uploadPrimerFile} />
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
						<button type="button" className={`w-100 btn btn-${(this.state.alignmentFiles === 'EXAMPLE_DATA' || this.state.refFile === 'EXAMPLE_DATA') ? 'success' : 'warning'} mt-3`} onClick={this.toggleLoadExampleData}>
							Load Example Data {(this.state.alignmentFiles === 'EXAMPLE_DATA' || this.state.refFile === 'EXAMPLE_DATA') && <strong>(Currently Using Example Files!)</strong>}
						</button>

						<button type="button" className="btn btn-primary w-100 mt-3" onClick={this.runViralConsensus}>Run ViralWasm-Consensus</button>
					</div>

					<div id="output" className={`form-group ms-4 me-5 ${this.state.expandedContainer === 'output' && 'full-width-container'} ${this.state.expandedContainer === 'input' && 'd-none'}`}>
						<div id="output-header" className="mb-3">
							<label htmlFor="output-text"><h5 className="my-0">Console</h5></label>
							<h4 className="my-0">
								<i className={`bi bi-${this.state.expandedContainer === 'output' ? 'arrows-angle-contract' : 'arrows-fullscreen'}`} onClick={() => this.toggleExpandContainer('output')}></i>
							</h4>
						</div>
						<textarea className="form-control" id="output-text" rows="3" disabled></textarea>
						{this.state.loading && <img id="loading" className="mt-3" src={loading} />}
						{(this.state.done && (this.state.consensusExists || this.state.posCountsExists || this.state.insCountsExists) &&
							<p className="mt-4 mb-2">ViralConsensus Output Files: </p>)}
						<div className="download-buttons">
							{(this.state.done && this.state.consensusExists) && <button type="button" className={`btn btn-success me-2 w-100`} onClick={() => this.downloadFile(CONSENSUS_FILE_NAME)}>Download Consensus FASTA</button>}
							{(this.state.done && this.state.posCountsExists) && <button type="button" className={`btn btn-success mx-2 w-100`} onClick={() => this.downloadFile(POSITION_COUNTS_FILE_NAME)}>Download Position Counts</button>}
							{(this.state.done && this.state.insCountsExists) && <button type="button" className={`btn btn-success ms-2 w-100`} onClick={() => this.downloadFile(INSERTION_COUNTS_FILE_NAME)}>Download Insertion Counts</button>}
						</div>
						{(this.state.done && (this.state.fastpOutputExists || this.state.minimapOutputExists) &&
							<p className="mt-3 mb-2">Other Output Files:</p>)}
						<div className="download-buttons">
							{(this.state.done && this.state.fastpOutputExists) && <button type="button" className={`btn btn-success me-2 w-100`} onClick={() => this.downloadFile(FASTP_OUTPUT_FILE_NAME)}>Download Trimmed Sequences (FASTP)</button>}
							{(this.state.done && this.state.minimapOutputExists) && <button type="button" className={`btn btn-success ms-2 w-100`} onClick={() => this.downloadFile(MINIMAP_OUTPUT_FILE_NAME)}>Download Aligned Sequences (Minimap2)</button>}
						</div>
						{this.state.done && this.state.inputChanged && <p className="text-danger text-center mt-4">Warning: Form input has changed since last run, run again to download latest output files.</p>}
					</div>
				</div>
			</div>
		)
	}
}

export default App
