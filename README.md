# Waldorf 

![Media Ecology Project Image](/media/cropped-mep_banner511.png)

Waldorf is a replacement video player for HTML5 videos which allows for 
viewing, creating, and modifying user-made annotations conforming to the
[W3C Web Annotation data model](https://www.w3.org/TR/annotation-model/),
and was created for the [Media Ecology Project](https://mediaecology.dartmouth.edu/). 

## How to Use

The following instructions are for using this plugin with your website.
You can find the latest version of the plugin in the Releases; if you'd like to 
build the plugin yourself, see [How to Build](#how-to-build).

### Prerequisites

* [jQuery](https://jquery.com/)
* [jQuery UI](https://jqueryui.com/)

### Deployment

You will need to import the above prerequisites and the files from the latest release 
on your page.

You can then use jQuery to reference a video object, and call `annotate()` on
it; the plugin will do the rest.

Example:
```html
<script>
    $("video").annotate();
</script>
```

You can see a full example at [/testpage/](/testpage/).

### Configuration

The .annotate() call can be passed an object with configuration options. Valid options include:

```
Server/storage options:
serverURL: serverAddress        //The URL of a Statler server API or Scalar book to store annotations
apiKey: apiKey                  //If you are managing access to Statler with an API key, 
                                //provide it here
localURL: localAnnotations      //If provided, loads annotations from a local json file
                                //This turns off serverURL and forces kioskMode=true

Editing options:
kioskMode: false                //kioskMode removes the annotation editing interface
showManifest: false             //showManifest adds a button to pop a new window with annotation
                                //json. kioskMode: true implies showManifest: true
tagsURL: tagsAddress            //If you have an external tagging vocabulary, provide the 
                                //URL to it here
displayIndex: true              //Whether or not to display an index of annotations
annotationServer: "scalar"      //use either "scalar" or "statler". Default is "scalar"

User options:
                                //NOTE: Setting these options will disable Stater user login!
cmsUsername: "User Name"        //The human-readable name to which attributions will be 
                                //attributed when connecting to Statler using an API key
cmsEmail: "user@example.com"    //The email address corresponding to cmsUsername. This will 
                                //be SHA1 encoded before sending it to the server.

Callbacks and hooks:

clearContainer: false           //Whether or not to remove old annotations when rendering
renderer: fnCustomRenderer      //A function to render annotations, overriding the default
unrenderer: fnCustomUnrenderer  //A function to unrender annotations, overriding the default
callback: fncb                  //A function to run after Waldorf has loaded
```

### Styling

Waldorf creates a new div wrapping the video tag that .annotate() is called on with `class="waldorf-container"`. Ideally, this is the CSS class you should target to change Waldorf's look and feel.

In addition to the video, Waldorf will either find or create two special page regions (identified by class name) used for rendering annotation data:

* A div with `class="waldorf-info"` will be where annotations are rendered and unrendered in synch with video playback.
* A div with `class="waldorf-index"` will show a listing of all annotations found for the current video. (this is optional based on the config option displayIndex mentioned above)

If your HTML contains divs with these classes your existing containers will be used. If these classes are not in your DOM when Waldorf loads it will create both containers below where the video appears on your page (again, pending the displayIndex option).

### Known Issues

For some reason, the vertical offset of the annotations are wrong (slightly raised)
when the Chrome dev tools are open and the video is fullscreen. If anyone has an idea
why, please let us know.

## How to Build

The following instructions are for building the plugin on your own machine.


This project is written in ES6 and is transpiled by Babel and Browserify into a bundled file.


Note that this project was developed with [Visual Studio Code](https://code.visualstudio.com/). 
It is highly recommended that you also use this.

### Prerequisites

* NPM

### Installation

1. Install the dependencies with NPM.

```
npm install
```

### Building

Building is done using Grunt. You can run any of the tasks with `grunt taskName`.

Tasks:

* `build`        - Bundles the source files into [/dist/](/dist/).
* `make_release` - Builds and compresses the final product for release.
* `preview`      - Sets up live development environment with BrowserSync. Loads 
                   [/testpage/](/testpage/).

## Built With

* Grunt
* Babel
* Browserify

## Authors

* **Jonathan Cole** - *VEMILab* - [joncole.me](http://www.joncole.me)
* **John Bell** - *Dartmouth College* - [johnpbell.com](http://www.johnpbell.com)

## License

This project is licensed under the MIT License. Please see the [LICENSE.md](LICENSE.md) file for details.
