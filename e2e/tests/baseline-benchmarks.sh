# Install ViralConsensus 
sudo apt-get update && sudo apt-get install -y libbz2-dev libcurl4-openssl-dev liblzma-dev
cd ~
git clone https://github.com/niemasd/ViralConsensus.git
cd ViralConsensus
make
sudo mv viral_consensus /usr/local/bin/

# Run ViralConsensus
viral_consensus --version
ls 
tree