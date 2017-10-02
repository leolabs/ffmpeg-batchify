const commander = require('commander');
const packageInfo = require('./package.json');
const ffmpegCommand = require('fluent-ffmpeg');
const fs = require('fs');
const yaml = require('js-yaml');
const {promisify} = require('util');
const readFileAsync = promisify(fs.readFile);

commander
    .version(packageInfo.version)
    .usage('[options] <files...>')
    .option('-c, --config [path]', 'Use a configuration file at the specified path')
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
        console.log(config);

        return Promise.all(commander.args.map(file => {
            const command = new ffmpegCommand(file);

            config.outputs.forEach(output => {
                var outputFile = file.substring(0, file.lastIndexOf('.'));

                if(output.suffix) outputFile += output.suffix;
                if(output.prefix) outputFile = output.prefix + outputFile;

                outputFile += "." + output.container;
                command.output(outputFile);

                if(output.container === 'flv') command.flvmeta();
                command.format(output.container);

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
                    if(output.video.size) command.videoSize(output.video.size);
                    if(output.video.aspect) command.aspect(output.video.aspect);
                    if(output.video.filters) command.videoFilters(output.video.filters);
                }

                if(output.options) command.outputOptions(output.options);
            });

            command.on('progress', function(progress) {
                console.log(`Processing ${file}: ${progress.percent}% done`);
            });

            command.on('stderr', function(stderrLine) {
                console.log('Stderr output: ' + stderrLine);
            });

            command.run();
        }))
    })
    .then(output => console.log)
    .catch(console.error);