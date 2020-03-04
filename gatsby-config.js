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
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'documents',
        path: `${__dirname}/src/documents`,
      },
    },
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'siteData',
        path: `src/_siteData`,
      },
    },
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: '_rates',
        path: `src/_rates`,
      },
    },
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: '_gallery',
        path: `src/_gallery`,
      },
    },
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: '_wecare',
        path: `src/_wecare`,
      },
    },
    {
      resolve: 'gatsby-plugin-root-import',
      options: {
        src: path.join(__dirname, 'src'),
        pages: path.join(__dirname, 'src/pages'),
        components: path.join(__dirname, 'src/components'),
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
        icon: 'src/images/gatsby-icon.png', // This path is relative to the root of the site.
      },
    },
    // this (optional) plugin enables Progressive Web App + Offline functionality
    // To learn more, visit: https://gatsby.dev/offline
    // 'gatsby-plugin-offline',
  ],
};
