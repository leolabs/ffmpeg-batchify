# What is this?

ffmpeg-batchify is a CLI tool that lets you convert multiple input files to multiple output formats using a config file. 
This can, for example, be used to convert videos to browser-friendly formats (mp4, flv, ogv, webm) in multiple resolutions.

# How production-ready is this?

Not really, yet. This is what I'd call the first alpha version. It kinda works but has a lot of weird bugs that 
I'm still working on. Also, it's not completely ready as a CLI yet.

# How does a config file look?

A config file can be either in JSON or YAML, you decide which format you prefer.

For now, only the output key is being used by ffmpeg-batchify, but this is what a config file could look like:

```yaml
outputs:
  - container: webm
    prefix: 1080p_
    video:
      codec: libvpx
      resolution: ?x1080
    audio:
      codec: libmp3lame
      bitrate: 256k
      channels: 1
    options: '-sn'
  - container: webm
    prefix: 480p_
    video:
      codec: libvpx
      resolution: ?x480
    audio:
      codec: libmp3lame
      bitrate: 256k
      channels: 1
    options: '-sn'
```

# Contributing

I'm always happy about contributions so if you have a new idea or want to fix a bug or two, go ahead, fork this project
and send me a pull request :rocket:

# License

You can use this project however you like. It would be nice, however, if you referred to this project when you use it somewhere.