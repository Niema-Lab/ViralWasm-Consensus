# Install fastp
cd ~
wget http://opengene.org/fastp/fastp.0.20.1
chmod a+x fastp.0.20.1
sudo mv fastp.0.20.1 /usr/local/bin/fastp

# Install minimap2 
cd ~
git clone https://github.com/lh3/minimap2 --branch v2.22
cd minimap2 && make
sudo mv minimap2 /usr/local/bin/

minimap2 --version

# Install seqtk
cd ~
git clone https://github.com/lh3/seqtk.git --branch v1.4
cd seqtk
make
sudo cp seqtk /usr/local/bin/
seqtk

# Install ViralConsensus 
cd ~
sudo apt-get update
sudo apt-get -y upgrade
sudo apt-get install -y automake bzip2 gcc g++ git libbz2-dev libcurl4-openssl-dev liblzma-dev make wget zlib1g-dev
wget -qO- "https://github.com/samtools/htslib/releases/download/1.18/htslib-1.18.tar.bz2" | tar -xj
cd htslib-*
autoreconf -i
./configure
make
sudo make install

export LD_LIBRARY_PATH="$LD_LIBRARY_PATH:/usr/local/lib"

cd ~
git clone https://github.com/niemasd/ViralConsensus.git
cd ViralConsensus
make
sudo mv viral_consensus /usr/local/bin/

# Confirm ViralConsensus is installed
viral_consensus --version