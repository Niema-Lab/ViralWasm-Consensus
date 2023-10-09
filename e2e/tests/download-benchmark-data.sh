SCRIPTPATH=$(dirname "$PWD")

# Download reads.fastq.gz file (1 milion sequences)
cd $SCRIPTPATH
mkdir data
cd data
curl -LO https://github.com/niemasd/ViralConsensus-Paper/raw/main/data/time_memory_benchmark/reads.fastq.gz
curl -LO https://github.com/Niema-Lab/ViralWasm-Consensus/raw/master/public/data/ref_genomes/NC_045512/NC_045512.fas

# Subsample: 100k reads
seqtk sample -s100 reads.fastq.gz 100000 | gzip > reads_100000.fastq.gz 

# Subsample: 10k reads
seqtk sample -s100 reads.fastq.gz 10000 | gzip > reads_10000.fastq.gz

# Subsample: 1k reads
seqtk sample -s100 reads.fastq.gz 1000 | gzip > reads_1000.fastq.gz

mv reads.fastq.gz reads_1000000.fastq.gz