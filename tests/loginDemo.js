/**
 * Forge Web ID Tests
 *
 * @author Dave Longley
 *
 * Copyright (c) 2010 Digital Bazaar, Inc. All rights reserved.
 */
(function($)
{
   // load flash socket pool
   window.forge.socketPool = {};
   window.forge.socketPool.ready = function()
   {
      // init forge xhr
      forge.xhr.init({
         flashId: 'socketPool',
         policyPort: 19945,
         msie: $.browser.msie,
         connections: 1,
         caCerts: [],
         verify: function(c, verified, depth, certs)
         {
            // don't care about cert verification for test
            return true;
         }
      });
      
      // init page
      init($);
   };
   swfobject.embedSWF(
      'forge/SocketPool.swf', 'socketPool', '0', '0', '9.0.0',
      false, {}, {allowscriptaccess: 'always'}, {});
})(jQuery);

var init = function($)
{
   var cat = 'web-id-login';
   
   // local alias
   var forge = window.forge;
   
   try
   {
      // get query variables
      var query = forge.util.getQueryVariables();
      var domain = query.domain || '';
      var redirect = query.redirect || '';
      redirect = 'https://' + domain + '/' + redirect;
      //console.log('domain', domain);
      //console.log('redirect', redirect);
      $('#domain').html(
         '<p>The domain "' + domain + '" is requesting your identity. If ' +
         'you want to login to the domain choose a Web ID.</p>');
      
      // get flash API
      var flashApi = document.getElementById('socketPool');
      
      // get web ids collection
      var webids = forge.util.getItem(
         flashApi, 'forge.test.webid', 'webids');
      webids = webids || {};
      
      var id = 0;
      var list = $('<ul/>');
      for(var key in webids)
      {
         (function(webid)
         {
            var cert = forge.pki.certificateFromPem(webid.certificate);
            var item = $('<li/>');
            var button = $('<button>');
            button.attr('id', '' + (webid + id++));
            button.html('Choose');
            button.click(function()
            {
               button.attr('disabled', 'disabled');
               
               $.ajax(
               {
                  type: 'GET',
                  url: '/',
                  success: function(data, textStatus, xhr)
                  {
                     if(data !== '')
                     {
                        //console.log('authentication completed');
                        //console.log(data);
                        window.name = data;
                     }
                     else
                     {
                        //console.log('authentication failed');
                        window.name = '';
                     }
                     window.location = redirect;
                  },
                  error: function(xhr, textStatus, errorThrown)
                  {
                     console.log('authentication failed');
                  },
                  xhr: function()
                  {
                     return forge.xhr.create({
                        url: 'https://' + domain,
                        connections: 1,
                        caCerts: [],
                        verify: function(c, verified, depth, certs)
                        {
                           // don't care about cert verification for test
                           return true;
                        },
                        getCertificate: function(c)
                        {
                           //console.log('using cert', webid.certificate);
                           return webid.certificate;
                        },
                        getPrivateKey: function(c)
                        {
                           //console.log('using private key', webid.privateKey);
                           return webid.privateKey;
                        }
                     });
                  }
               });
            });
            item.append(button);
            item.append(' ' + key + '<br/>');
            
            // display certificate attributes
            var attr;
            for(var n = 0; n < cert.subject.attributes.length; ++n)
            {
               attr = cert.subject.attributes[n];
               item.append(attr.name + ': ' + attr.value + '<br/>');
            }
            
            list.append(item);
         })(webids[key]);
      }
      if(list.html() === '<ul/>')
      {
         list.append('None');
      }
      
      $('#webids').append(list);
   }
   catch(ex)
   {
      console.log(ex);
   }
};
