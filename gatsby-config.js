const path = require('path');

module.exports = {
  siteMetadata: {
    title: 'nickhu.info',
    description: 'Portfolio website of nickhu.info',
    author: '@gatsbyjs',
  },
  plugins: [
    'gatsby-plugin-sass',
    'gatsby-plugin-react-helmet',
    'gatsby-plugin-netlify-cms',
    'gatsby-plugin-polyfill-io',
    'gatsby-transformer-remark',
    {
      resolve: "gatsby-plugin-stylelint",
      options: { files: ["**/*.{scss,css}"] }
    },
    {
      resolve: `gatsby-plugin-typescript`,
      options: {
        isTSX: true,
        jsxPragma: `React`,
        allExtensions: true,
      },
    },
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'images',
        path: `${__dirname}/src/images`,
      },
    },
    {
      resolve: 'gatsby-plugin-root-import',
      options: {
        src: path.join(__dirname, 'src'),
        pages: path.join(__dirname, 'src/pages'),
        components: path.join(__dirname, 'src/components'),
        hooks: path.join(__dirname, 'src/hooks'),
        styles: path.join(__dirname, 'src/styles'),
        images: path.join(__dirname, 'src/images'),
      },
    },
    'gatsby-transformer-sharp',
    'gatsby-plugin-sharp',
    {
      resolve: 'gatsby-plugin-manifest',
      options: {
        name: 'gatsby-starter-default',
        short_name: 'nickhu.info',
        start_url: '/',
        background_color: '#663399',
        theme_color: '#663399',
        display: 'minimal-ui',
      },
    },
    // this (optional) plugin enables Progressive Web App + Offline functionality
    // To learn more, visit: https://gatsby.dev/offline
    // 'gatsby-plugin-offline',
  ],
};
