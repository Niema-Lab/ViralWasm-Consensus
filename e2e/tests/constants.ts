export const BENCHMARK_DIR = 'benchmarks/';
export const BENCHMARK_TESTS = ['1000', '10000', '100000', '1000000'];
export const RUN_COUNT = 10;
export const downloadFile = async (page, identifier: string, location: string) => {
	const downloadPromise = page.waitForEvent('download');
	await page.getByText(identifier).click();
	const download = await downloadPromise;
	await download.saveAs(location + download.suggestedFilename());
}