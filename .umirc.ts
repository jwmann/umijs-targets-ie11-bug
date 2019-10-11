import { IConfig } from 'umi-types';
import slash from 'slash2';

// ref: https://umijs.org/config/
const config: IConfig = {
  treeShaking: true,
  plugins: [
    // ref: https://umijs.org/plugin/umi-plugin-react.html
    [
      'umi-plugin-react',
      {
        antd: false,
        dva: false,
        dynamicImport: false,
        title: 'App',
        dll: false,
        locale: {
          enable: true,
          default: 'en-US',
        },
        routes: {
          exclude: [
            /components\//,
            /services\//,
            /service\.(t|j)sx?$/,
            /models\//,
            /model\.(t|j)sx?$/,
            /utils\//,
            /types\//,
            /hooks\//,
          ],
        },
      },
    ],
  ],
  targets: {
    ie: 11,
  },
  lessLoaderOptions: {
    javascriptEnabled: true,
  },
  disableRedirectHoist: true,
  cssLoaderOptions: {
    modules: true,
    getLocalIdent: (
      context: {
        resourcePath: string;
      },
      _: string,
      localName: string,
    ) => {
      if (
        context.resourcePath.includes('node_modules') ||
        context.resourcePath.includes('global.less')
      ) {
        return localName;
      }

      const match = context.resourcePath.match(/src(.*)/);

      if (match && match[1]) {
        const appPath = match[1].replace('.less', '');
        const arr = slash(appPath)
          .split('/')
          .map((a: string) => a.replace(/([A-Z])/g, '-$1'))
          .map((a: string) => a.toLowerCase());
        return `app-${arr.join('-')}-${localName}`.replace(/--/g, '-');
      }

      return localName;
    },
  },
};

export default config;
