

                var fs = require('fs');
                const request = require('request');

                var apiEndPoint = normalizeApiEndpoint(
                    process.env.PLUGN_STORE_API_ENDPOINT || 'http://localhost/~Saoud/plugn/plugn-yii2/api/web/v2'
                );

                var storebranchName = validateStoreBranchName(process.env.PLUGN_STORE_BRANCH || 'main');


                var url = apiEndPoint + '/store/get-restaurant-data/' + storebranchName;

                request(url, function(err, res, body) {
                  if (err)
                      throw err;

                  if (!res || res.statusCode >= 400)
                      throw new Error('Unable to load store data from ' + url + ': HTTP ' + (res && res.statusCode));

                  var response = JSON.parse(body);

                  overwriteIndexHtml(response);
                  overwriteCapacitorConfig(response.app_id, response.name);
                  overwriteGlobalScss(response.custom_css, response.name);
                  overwriteManifest(response.restaurant_uuid, response.name, response.theme_color, response.logo);
                  overwriteRobotsTxt(response.restaurant_uuid, response.restaurant_domain, apiEndPoint);
                  overwriteEnvironment(response.restaurant_uuid, storebranchName, apiEndPoint);
                  overwriteAngularFile(storebranchName);
                });

                /**
                 * Escape text before interpolating store-provided values into HTML attributes or tags.
                 */
                function escapeHtml(value) {
                  return String(value || '').replace(/[&<>"']/g, function(character) {
                      return {
                          '&': '&amp;',
                          '<': '&lt;',
                          '>': '&gt;',
                          '"': '&quot;',
                          "'": '&#39;'
                      }[character];
                  });
                }

                /**
                 * Normalize a storefront public URL so canonical, OpenGraph, and robots output are stable.
                 */
                function normalizePublicUrl(value) {
                  var url = String(value || '').trim();

                  if (!url)
                      return '';

                  if (url.indexOf('//') === 0)
                      url = 'https:' + url;
                  else if (!/^https?:\/\//i.test(url))
                      url = 'https://' + url;

                  return url.replace(/\/+$/, '');
                }

                /**
                 * Trim trailing slashes from the API endpoint used for fetches and sitemap URLs.
                 */
                function normalizeApiEndpoint(value) {
                  return String(value || '').trim().replace(/\/+$/, '');
                }

                /**
                 * Restrict branch names before they are embedded into generated build commands and paths.
                 */
                function validateStoreBranchName(value) {
                  var branchName = String(value || '').trim();

                  if (!/^[A-Za-z0-9._-]+$/.test(branchName))
                      throw new Error('Invalid store branch name: ' + branchName);

                  return branchName;
                }

                /**
                 * Return a valid manifest/meta theme color, falling back to white for unsafe values.
                 */
                function themeColorOrDefault(value) {
                  return /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value || '')
                      ? value
                      : '#ffffff';
                }

                /**
                 * Facebook Pixel IDs are numeric; reject anything that could break inline script output.
                 */
                function facebookPixelIdOrDefault(value) {
                  var pixelId = String(value || '').trim();

                  return /^[0-9]+$/.test(pixelId) ? pixelId : '';
                }

                /**
                 * Build a Cloudinary logo URL while encoding store-controlled path segments.
                 */
                function cloudinaryLogoUrl(storeUuid, storeLogo, transform) {
                  return 'https://res.cloudinary.com/plugn/image/upload/' + transform
                      + '/restaurants/' + encodeURIComponent(storeUuid || '')
                      + '/logo/' + encodeURIComponent(storeLogo || '');
                }

                /**
                 * Regenerate index.html with sanitized SEO, social, icon, and analytics metadata.
                 */
                function overwriteIndexHtml(store) {

                  var facebookPixilId = facebookPixelIdOrDefault(store.facebook_pixil_id);
                  var googleAnalyticsId = store.google_analytics_id;
                  var storeName = store.name;
                  var storeUuid = store.restaurant_uuid;
                  var storeTagline = store.tagline;
                  var storeLogo = store.logo;
                  var storeDomain = normalizePublicUrl(store.restaurant_domain);
                  var storeThemeColor = store.theme_color;

                  var storeContent = store.name;

                  if (store.tagline)
                    storeContent = storeContent + ' | ' + store.tagline;

                  var safeStoreName = escapeHtml(storeName);
                  var safeStoreContent = escapeHtml(storeContent);
                  var safeStoreDescription = escapeHtml(storeTagline || storeName);
                  var safeStoreDomain = escapeHtml(storeDomain);
                  var safeThemeColor = themeColorOrDefault(storeThemeColor);
                  var iconUrl = cloudinaryLogoUrl(storeUuid, storeLogo, 'w_100,h_100');
                  var appleIconUrl = cloudinaryLogoUrl(storeUuid, storeLogo, 'w_300,h_300,b_rgb:ffffff');
                  var startupImageUrl = cloudinaryLogoUrl(storeUuid, storeLogo, 'w_200,h_200,b_rgb:ffffff');
                  var socialImageUrl = cloudinaryLogoUrl(storeUuid, storeLogo, 'w_1200,h_630,c_pad,b_rgb:ffffff');

                  var buildFileJs = `
                              #!/usr/bin/env bash
                              ng build -c=` + storebranchName;
                  fs.writeFileSync('build.sh', buildFileJs);
                  fs.chmod('build.sh', 0o775, (err) => {
                      if (err) throw err;
                      fs.writeFileSync('build.sh', buildFileJs);
                  });

                  var facebookPixilCode = '';
                  if (facebookPixilId) {
                      var facebookPixilIdLiteral = JSON.stringify(String(facebookPixilId));
                      var facebookPixilUrl = 'https://www.facebook.com/tr?id=' + encodeURIComponent(String(facebookPixilId)) + '&ev=PageView&noscript=1';
                      facebookPixilCode = `

                              <!-- Facebook Pixel Code -->
                              <script>
                                 !function(f,b,e,v,n,t,s)
                                 {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                                 n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                                 if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                                 n.queue=[];t=b.createElement(e);t.async=!0;
                                 t.src=v;s=b.getElementsByTagName(e)[0];
                                 s.parentNode.insertBefore(t,s)}(window, document,'script',
                                 'https://connect.facebook.net/en_US/fbevents.js');
                                 fbq('init', ` + facebookPixilIdLiteral + `);
                                 fbq('track', 'PageView');
                              </script>


                              <noscript>
                                      <img height='1' width='1' style='display:none'
                                 src='` + escapeHtml(facebookPixilUrl) + `'
                                 />
                              </noscript>
                              <!-- End Facebook Pixel Code -->
                              `;
                  }



                  var googleAnalyticsCode = '';
                  if (googleAnalyticsId) {
                      googleAnalyticsCode = `

                              <script>
                                 (function (i, s, o, g, r, a, m) {
                                   i['GoogleAnalyticsObject'] = r; i[r] = i[r] || function () {
                                     (i[r].q = i[r].q || []).push(arguments)
                                   }, i[r].l = 1 * new Date(); a = s.createElement(o),
                                     m = s.getElementsByTagName(o)[0]; a.async = 1; a.src = g; m.parentNode.insertBefore(a, m)
                                 })(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');
                              </script>
                              `;
                  }
                  var htmlFile = `
    <!DOCTYPE html>
      <html lang='en' dir='ltr'>

      <head>
        <meta charset='utf-8' />
        <title>` + safeStoreContent + `</title>
        <base href='/' />
        <meta name='description' content='` + safeStoreDescription + `'>
        <meta name='viewport'
          content='viewport-fit=cover, width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no' />
        <meta name='format-detection' content='telephone=no' />
        <meta name='msapplication-tap-highlight' content='no' />
        <link rel='canonical' href='` + safeStoreDomain + `' />
        <link rel='icon' type='image/png'
          href='` + escapeHtml(iconUrl) + `' />
        <link rel='apple-touch-icon'
          href='` + escapeHtml(appleIconUrl) + `' />
        <link rel='apple-touch-startup-image'
          href='` + escapeHtml(startupImageUrl) + `' />
        <!-- add to homescreen for ios -->
        <meta name='mobile-web-app-capable' content='yes' />
        <meta name='apple-touch-fullscreen' content='yes' />
        <meta name='apple-mobile-web-app-title' content='` + safeStoreName + `' />
        <meta name='apple-mobile-web-app-capable' content='yes' />
        <meta name='apple-mobile-web-app-status-bar-style' content='default' />
        <!-- Meta tags for social media -->
        <meta property='og:type' content='website' />
        <meta property='og:url' content='` + safeStoreDomain + `' />
        <meta property='og:title' content='` + safeStoreContent + `' />
        <meta property='og:description' content='` + safeStoreDescription + `' />
        <meta property='og:site_name' content='` + safeStoreName + `' />
        <meta property='og:image' itemprop='image primaryImageOfPage'
          content='` + escapeHtml(socialImageUrl) + `' />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:domain' content='` + safeStoreDomain + `' />
        <meta name='twitter:title' itemprop='name' content='` + safeStoreContent + `' />
        <meta name='twitter:description' itemprop='description' content='` + safeStoreDescription + `' />
        <meta name='twitter:image' content='` + escapeHtml(socialImageUrl) + `' />
        <link rel='manifest' href='manifest.webmanifest'>
        <meta name='theme-color' content='` + safeThemeColor + `'>
        ` + facebookPixilCode + `

        <script src='https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.3.4/bluebird.min.js'></script>
        <script src='https://secure.gosell.io/js/sdk/tap.min.js'></script>
      </head>

      <body>
        <app-root></app-root>
        ` + googleAnalyticsCode + `

        <noscript>Please enable JavaScript to continue using this application.</noscript>
      </body>

      </html>  `;
                  fs.writeFileSync('src/index.html', htmlFile);
                }


                /**
                 * Write capacitor.config.json through JSON serialization so app metadata stays valid.
                 */
                function overwriteCapacitorConfig(storeAppId, storeName) {
                  var capacitorConfig = JSON.stringify({
                      "appId": storeAppId || '',
                      "appName": storeName || '',
                      "bundledWebRuntime": false,
                      "npmClient": "npm",
                      "webDir": "www",
                      "plugins": {
                          "SplashScreen": {
                              "launchShowDuration": 0
                          }
                      },
                      "cordova": {
                          "preferences": {
                              "ScrollEnabled": "false",
                              "android-minSdkVersion": "19",
                              "BackupWebStorage": "none",
                              "SplashMaintainAspectRatio": "true",
                              "FadeSplashScreenDuration": "300",
                              "SplashShowOnlyFirstTime": "false",
                              "SplashScreen": "screen",
                              "SplashScreenDelay": "3000"
                          }
                      }
                  }, null, 2);
                  fs.writeFileSync('capacitor.config.json', capacitorConfig);
                }

                /**
                 * Reject custom CSS constructs that can load remote resources or execute legacy expressions.
                 */
                function sanitizeCustomCss(value) {
                  var css = String(value || '');
                  var unsafePattern = /@import|url\s*\(|expression\s*\(|javascript\s*:|data\s*:|-moz-binding|behavior\s*:/i;

                  if (unsafePattern.test(css))
                      throw new Error('Unsafe custom CSS rejected');

                  return css;
                }

                /**
                 * Append sanitized custom CSS and ensure the icon asset directory exists.
                 */
                function overwriteGlobalScss(storeCustomCss) {

                  if (storeCustomCss)
                      fs.appendFileSync('src/global.scss', sanitizeCustomCss(storeCustomCss));
                  var dir = 'src/assets/icons';
                  if (!fs.existsSync(dir)) {
                      fs.mkdirSync(dir);
                  }
                }

                /**
                 * Generate robots.txt with a normalized host and sitemap endpoint for the storefront.
                 */
                function overwriteRobotsTxt(storeUuid, storeDomain, apiEndPoint) {
                  var publicUrl = normalizePublicUrl(storeDomain);
                  var sitemapUrl = normalizeApiEndpoint(apiEndPoint) + '/sitemap/' + encodeURIComponent(storeUuid || '');
                  var robotsFile = 'User-agent: *\nAllow: /\n';

                  if (publicUrl)
                      robotsFile += 'Host: ' + publicUrl.replace(/^https?:\/\//i, '') + '\n';

                  robotsFile += 'Sitemap: ' + sitemapUrl + '\n';

                  fs.writeFileSync('src/robots.txt', robotsFile);
                }

                /**
                 * Generate PWA icons and write manifest.webmanifest as structured JSON.
                 */
                function overwriteManifest(storeUuid, storeName, storeThemeColor, storeLogo) {


                  var download = function(uri, filename, callback) {
                      var complete = false;
                      var done = function(err) {
                          if (complete)
                              return;

                          complete = true;

                          if (err)
                              console.error('Unable to download ' + uri + ': ' + err.message);

                          callback(err);
                      };

                      request.head(uri, function(err, res) {
                          if (err)
                              return done(err);

                          if (!res || res.statusCode >= 400)
                              return done(new Error('HTTP ' + (res && res.statusCode)));

                          request(uri)
                              .on('error', done)
                              .pipe(fs.createWriteStream(filename)
                                  .on('error', done)
                                  .on('close', function() { done(); }));
                      });
                  };
                  download(cloudinaryLogoUrl(storeUuid, storeLogo, 'w_72,h_72'), 'src/assets/icons/icon-72x72.png', function() {});
                  download(cloudinaryLogoUrl(storeUuid, storeLogo, 'w_96,h_96'), 'src/assets/icons/icon-96x96.png', function() {});
                  download(cloudinaryLogoUrl(storeUuid, storeLogo, 'w_128,h_128'), 'src/assets/icons/icon-128x128.png', function() {});
                  download(cloudinaryLogoUrl(storeUuid, storeLogo, 'w_144,h_144'), 'src/assets/icons/icon-144x144.png', function() {});
                  download(cloudinaryLogoUrl(storeUuid, storeLogo, 'w_152,h_152'), 'src/assets/icons/icon-152x152.png', function() {});
                  download(cloudinaryLogoUrl(storeUuid, storeLogo, 'w_192,h_192'), 'src/assets/icons/icon-192x192.png', function() {});
                  download(cloudinaryLogoUrl(storeUuid, storeLogo, 'w_384,h_384'), 'src/assets/icons/icon-384x384.png', function() {});
                  download(cloudinaryLogoUrl(storeUuid, storeLogo, 'w_512,h_512'), 'src/assets/icons/icon-512x512.png', function() {});
                  var manifestFile = JSON.stringify({
                      "name": storeName || '',
                      "short_name": storeName || '',
                      "theme_color": themeColorOrDefault(storeThemeColor),
                      "background_color": "#fafafa",
                      "display": "standalone",
                      "scope": "./",
                      "start_url": "./",
                      "icons": [
                          {"src": "assets/icons/icon-72x72.png", "sizes": "72x72", "type": "image/png", "purpose": "maskable any"},
                          {"src": "assets/icons/icon-96x96.png", "sizes": "96x96", "type": "image/png", "purpose": "maskable any"},
                          {"src": "assets/icons/icon-128x128.png", "sizes": "128x128", "type": "image/png", "purpose": "maskable any"},
                          {"src": "assets/icons/icon-144x144.png", "sizes": "144x144", "type": "image/png", "purpose": "maskable any"},
                          {"src": "assets/icons/icon-152x152.png", "sizes": "152x152", "type": "image/png", "purpose": "maskable any"},
                          {"src": "assets/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable any"},
                          {"src": "assets/icons/icon-384x384.png", "sizes": "384x384", "type": "image/png", "purpose": "maskable any"},
                          {"src": "assets/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable any"}
                      ]
                  }, null, 2);
                  fs.writeFileSync('src/manifest.webmanifest', manifestFile);
                }


                /**
                 * Write the Angular production environment file with escaped endpoint and store UUID values.
                 */
                function overwriteEnvironment(storeUuid, storebranchName, apiEndPoint) {

                  var environmentFile = `
export const environment = {
  production: true,
  envName: 'prod',
  apiEndpoint : ` + JSON.stringify(apiEndPoint) + `,
  restaurantUuid : ` + JSON.stringify(storeUuid || '') + `
};`;
                  fs.writeFileSync('src/environments/environment.' + storebranchName + '.ts', environmentFile);

                }

                /**
                 * Rewrite angular.json so the selected branch config includes the generated robots asset.
                 */
                function overwriteAngularFile(storebranchName) {

                  var angularFile = `{
    "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
    "version": 1,
    "defaultProject": "app",
    "newProjectRoot": "projects",
    "projects": {
        "app": {
            "root": "",
            "sourceRoot": "src",
            "projectType": "application",
            "prefix": "app",
            "schematics": {},
            "architect": {
                "build": {
                    "builder": "@angular-devkit/build-angular:browser",
                    "options": {
                        "outputPath": "www",
                        "index": "src/index.html",
                        "main": "src/main.ts",
                        "polyfills": "src/polyfills.ts",
                        "tsConfig": "tsconfig.app.json",
                        "assets": [
                            {
                                "glob": "**/*",
    "input": "src/assets",
    "output": "assets"
},
{
    "glob": "**/*.svg",
                                "input": "node_modules/ionicons/dist/ionicons/svg",
                                "output": "./svg"
                            },
                            "src/manifest.webmanifest",
                            "src/robots.txt",
                            "src/_redirects"
                        ],
                        "styles": [
                            "src/assets/tel-input/css/intlTelInput.css",
                            "src/assets/tel-input/css/bootstrap.min.css",
                            {
                                "input": "src/theme/variables.scss"
                            },
                            {
                                "input": "src/global.scss"
                            }
                        ],
                        "scripts": []
                    },
                    "configurations": {
                        "` + storebranchName + `": {
                            "fileReplacements": [
                                {
                                    "replace": "src/environments/environment.ts",
                                    "with": "src/environments/environment.` + storebranchName + `.ts"
                                }
                            ],
                            "optimization": true,
                            "outputHashing": "all",
                            "sourceMap": false,
                            "namedChunks": false,
                            "aot": true,
                            "extractLicenses": true,
                            "vendorChunk": false,
                            "buildOptimizer": true,
                            "budgets": [
                                {
                                    "type": "initial",
                                    "maximumWarning": "2mb",
                                    "maximumError": "5mb"
                                }
                            ],
                            "serviceWorker": true,
                            "ngswConfigPath": "ngsw-config.json"
                        },
                        "ci": {
                            "progress": false
                        }
                    }
                },
                "serve": {
                    "builder": "@angular-devkit/build-angular:dev-server",
                    "options": {
                        "browserTarget": "app:build"
                    },
                    "configurations": {
                        "` + storebranchName + `": {
                            "browserTarget": "app:build:` + storebranchName + `"
                        },
                        "ci": {
                            "progress": false
                        }
                    }
                },
                "extract-i18n": {
                    "builder": "@angular-devkit/build-angular:extract-i18n",
                    "options": {
                        "browserTarget": "app:build"
                    }
                },
                "test": {
                    "builder": "@angular-devkit/build-angular:karma",
                    "options": {
                        "main": "src/test.ts",
                        "polyfills": "src/polyfills.ts",
                        "tsConfig": "tsconfig.spec.json",
                        "karmaConfig": "karma.conf.js",
                        "styles": [],
                        "scripts": [],
                        "assets": [
                            {
                                "glob": "favicon.ico",
                                "input": "src/",
                                "output": "/"
                            },
                            {
                                "glob": "**/*",
    "input": "src/assets",
    "output": "/assets"
},
    "src/manifest.webmanifest"
]
},
    "configurations": {
    "ci": {
    "progress": false,
    "watch": false
}
}
},
    "lint": {
    "builder": "@angular-devkit/build-angular:tslint",
    "options": {
    "tsConfig": [
    "tsconfig.app.json",
    "tsconfig.spec.json",
    "e2e/tsconfig.json"
],
    "exclude": ["**/node_modules/**"]
}
},
    "e2e": {
    "builder": "@angular-devkit/build-angular:protractor",
    "options": {
    "protractorConfig": "e2e/protractor.conf.js",
    "devServerTarget": "app:serve"
},
    "configurations": {
    "production": {
    "devServerTarget": "app:serve:production"
},
    "ci": {
    "devServerTarget": "app:serve:ci"
}
}
},
    "ionic-cordova-build": {
    "builder": "@ionic/angular-toolkit:cordova-build",
    "options": {
    "browserTarget": "app:build"
},
    "configurations": {
    "production": {
    "browserTarget": "app:build:production"
}
}
},
    "ionic-cordova-serve": {
    "builder": "@ionic/angular-toolkit:cordova-serve",
    "options": {
    "cordovaBuildTarget": "app:ionic-cordova-build",
    "devServerTarget": "app:serve"
},
    "configurations": {
    "production": {
    "cordovaBuildTarget": "app:ionic-cordova-build:production",
    "devServerTarget": "app:serve:production"
 }
 }
    }
 }
    }
},
    "cli": {
    "defaultCollection": "@ionic/angular-toolkit"
},
    "schematics": {
    "@ionic/angular-toolkit:component": {
    "styleext": "scss"
},
    "@ionic/angular-toolkit:page": {
    "styleext": "scss"
 }
    }
}`;
                  fs.writeFileSync('angular.json', angularFile);
                }
