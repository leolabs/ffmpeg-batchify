const commander = require('commander');
const packageInfo = require('./package.json');
const ffmpegCommand = require('fluent-ffmpeg');
const fs = require('fs');
const yaml = require('js-yaml');
const {promisify} = require('util');
const readFileAsync = promisify(fs.readFile);
const path = require('path');
const ProgressBar = require('ascii-progress');

commander
    .version(packageInfo.version)
    .usage('[options] <files...>')
    .option('-c, --config [path]', 'Use a configuration file at the specified path')
    .option('-v, --verbose', 'Output additional information')
    .parse(process.argv);

if (commander.args.length === 0) {
    commander.outputHelp();
    process.exit(1);
}

if (!commander.config) {
    console.error("You need to specify a config file either in YAML or JSON format");
    commander.outputHelp();
    process.exit(1)
}

function generateOutputPath(inputPath, format, prefix, suffix) {
    const inputDir = path.dirname(inputPath);
    const inputExtension = inputPath.substring(inputPath.lastIndexOf('.'));
    let outputFile = path.basename(inputPath, inputExtension);

    if(suffix) outputFile += suffix;
    if(prefix) outputFile = prefix + outputFile;

    outputFile += "." + format;

    return path.join(inputDir, outputFile);
}

const configPath = commander.config;
readFileAsync(commander.config)
    .then(text => {
        if (configPath.endsWith('.json')) {
            return JSON.parse(text);
        } else if (configPath.endsWith('.yml')) {
            return yaml.safeLoad(text);
        } else {
            throw new Exception('Config file is neither JSON nor YML');
        }
    })
    .then(config => {
        return Promise.all(commander.args.map(file => {
            const command = new ffmpegCommand(file);

            config.outputs.forEach(output => {
                command.output(generateOutputPath(file, output.format, output.prefix, output.suffix));

                if(output.container === 'flv') command.flvmeta();
                command.format(output.format);

                if(output.audio) {
                    if(output.audio.codec) command.audioCodec(output.audio.codec);
                    if(output.audio.bitrate) command.audioBitrate(output.audio.bitrate);
                    if(output.audio.channels) command.audioChannels(output.audio.channels);
                    if(output.audio.filters) command.audioFilters(output.audio.filters);
                }

                if(output.video) {
                    if(output.video.codec) command.videoCodec(output.video.codec);
                    if(output.video.bitrate) command.videoBitrate(output.video.bitrate);
                    if(output.video.fps) command.fps(output.video.bitrate);
                    if(output.video.size) command.size(output.video.size);
                    if(output.video.aspect) command.aspect(output.video.aspect);
                    if(output.video.filters) command.videoFilters(output.video.filters);
                }

                if(output.options) command.outputOptions(output.options);
            });

            var bar;

            command.on('start', command => {
                if(commander.verbose) {
                    console.log(`🚀 Starting encoding of ${path.basename(file)}`);
                    console.log(`👉 Command: ${command}`);
                }

                bar = new ProgressBar({
                    schema: '[:bar] :fpsfps :percent :etas :file',
                    total: 100,
                    filled: '=',
                    blank: '-'
                });
            });

            command.on('progress', function(progress) {
                bar.update(progress.percent / 100, {
                    fps: progress.currentFps,
                    file: path.basename(file)
                });
            });

            command.run();
        }))
    })
    .then(output => console.log)
    .catch(console.error);