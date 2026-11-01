// MathJax 3 reads this global when its script runs, so this file must load first (both are deferred).
window.MathJax = {
  tex: {
    inlineMath: [['\\(', '\\)']],
    displayMath: [['\\[', '\\]']],
    autoload: {
      color: [],
      colorv2: ['color'],
    },
    packages: { '[+]': ['noerrors'] },
  },
  options: {
    ignoreHtmlClass: 'tex2jax_ignore',
    processHtmlClass: 'tex2jax_process',
  },
  loader: {
    load: ['[tex]/noerrors'],
  },
};
