const DefinePlugin = require("webpack").DefinePlugin;

const publishingOptions = {
  provider: "github",
  releaseType: "prerelease",
  vPrefixedTagName: false
};

module.exports = {
  runtimeCompiler: true,

  // https://cli.vuejs.org/config/#pages
  pages: {
    index: "src/main.js",
    colorPicker: "src/subpages/color-picker/main.js",
    splashScreen: "src/subpages/splash-screen/main.js"
  },

  chainWebpack: config => {
    config.module
      .rule("vue")
      .use("vue-loader")
      .tap(options => {
        options.compiler = require("vue-template-babel-compiler");
        return options;
      });
  },

  configureWebpack: {
    module: {
      rules: [
        {
          test: /\.(glsl|vert|frag|fs|vs)$/,
          loader: "text-loader"
        }
      ]
    },

    devServer: {
      hot: true
    },

    node: {
      __dirname: process.env.NODE_ENV !== "production",
      __filename: process.env.NODE_ENV !== "production"
    }
  },

  pluginOptions: {
    electronBuilder: {
      mainProcessFile: "src/background/background.js",
      mainProcessWatch: ["src/background", "src/media-manager"],
      nodeIntegration: true,

      externals: [
        "!color",
        "!lodash.clonedeep",
        "!lodash.get",
        "!events",
        "!debug",
        "!assert",

        "fluent-ffmpeg",
        "animated-gif-detector",
        "ospath",
        "stream-to-blob",
        "grandiose",
        "npm",
        "webpack-3",
        "font-list"
      ],

      builderOptions: {
        appId: "gl.vcync.modv",
        productName: "modV",

        linux: {
          category: "Graphics",
          target: ["AppImage"]
        },

        // See https://www.electron.build/configuration/mac
        mac: {
          // See https://developer.apple.com/documentation/security/hardened_runtime
          hardenedRuntime: true,
          // See https://github.com/vcync/modV/issues/413
          strictVerify: false,
          gatekeeperAssess: false,
          entitlements: "build/entitlements.mac.plist",
          entitlementsInherit: "build/entitlements.mac.plist",
          extendInfo: {
            NSCameraUsageDescription:
              "This app requires camera access to record video.",
            NSMicrophoneUsageDescription:
              "This app requires microphone access to record audio."
          },
          target: {
            target: "default",
            arch: "universal"
          },
          singleArchFiles: "node_modules/grandiose/**"
        },

        dmg: {
          sign: false
        },

        afterSign: "notarize.js",

        win: {
          icon: "build/icon.ico"
        },

        publish: publishingOptions
      },

      chainWebpackMainProcess: config => {
        config.module
          .rule("nodeloader")
          .test(/\.node$/)
          .use("nodeloader")
          .loader("node-loader");

        config
          .plugin("define")
          .use(DefinePlugin, [{ "process.env.FLUENTFFMPEG_COV": false }]);

        config.module
          .rule("babel")
          .test(/\.m?js$/)
          .exclude.add(/node_modules/)
          .end()
          .use("babelloader")
          .loader("babel-loader", {
            presets: [["@babel/preset-env", { targets: "defaults" }]]
          });
      },

      chainWebpackRendererProcess: config => {
        config.plugin("define").use(DefinePlugin, [
          {
            "process.env": {
              NODE_ENV: '"production"',
              BASE_URL: "`app://./`",
              IS_ELECTRON: true
            }
          }
        ]);

        return config;
      }
    }
  }
};
