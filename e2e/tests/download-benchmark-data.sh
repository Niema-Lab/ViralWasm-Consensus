# TODO: setup github cache
SCRIPTPATH=$(dirname "$PWD")

# Install seqtk
cd ~
git clone https://github.com/lh3/seqtk.git
cd seqtk
make
sudo cp seqtk /usr/local/bin/
seqtk

# Download reads.fastq.gz file (1 milion sequences)
cd $SCRIPTPATH
mkdir data
cd data
curl -LO https://github.com/niemasd/ViralConsensus-Paper/raw/main/data/time_memory_benchmark/reads.fastq.gz
curl -LO https://github.com/Niema-Lab/ViralWasm-Consensus/raw/master/public/data/NC_045512.2.fas
curl -LO https://github.com/Niema-Lab/ViralWasm-Consensus/raw/master/public/data/example.bam

# Subsample: 100k reads
seqtk sample -s100 reads.fastq.gz 100000 | gzip > reads_100k.fastq.gz 

# Subsample: 10k reads
seqtk sample -s100 reads.fastq.gz 10000 | gzip > reads_10k.fastq.gz

# Subsample: 1k reads
seqtk sample -s100 reads.fastq.gz 1000 | gzip > reads_1k.fastq.gz
