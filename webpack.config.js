const path = require("path");

module.exports = {
    target: "web",
    mode: "development",
    devtool: "inline-source-map",
    entry: "./srv/app/main.js",
    output: {
        // options related to how webpack emits results
        path: path.resolve(__dirname, "srv"), // string
        // the target directory for all output files
        // must be an absolute path (use the Node.js path module)
        filename: "bundle.js", // string
        // the filename template for entry chunks
    },
    resolve: {
        // Add `.ts` and `.tsx` as a resolvable extension.
        extensions: [".js"]
    },
}