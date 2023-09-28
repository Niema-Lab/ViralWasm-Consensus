# Install minimap2 
cd ~
git clone https://github.com/lh3/minimap2
cd minimap2 && make

minimap2 --version

# Install ViralConsensus 
sudo apt-get update && sudo apt-get install -y libbz2-dev libcurl4-openssl-dev liblzma-dev
cd ~
git clone https://github.com/niemasd/ViralConsensus.git
cd ViralConsensus
make
sudo mv viral_consensus /usr/local/bin/

# Confirm ViralConsensus is installed
viral_consensus --version

