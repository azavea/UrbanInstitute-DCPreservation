(function(P) {
    P.App = function(options) {
        var _self = {},
            _options = $.extend({
                target: 'body',
                bindTo: P,
                tabTarget: ''
            }, options),
            _uiState = {
                dataType: 'pdp-pdb-view',
                uiType: 'pdp-map-view'
            },
            _$main,
            _$tabContainer;

        //Toggles what functionality is currently visible, based on the state.
        //This works by using multiple classes on elements in the DOM. You can
        //find them on default.aspx.
        //PDB/Table, Nychanis/Table, PDB/Map, or Nychanis/Map
        var _updateContent = Azavea.tryCatch('update main content', function() {
            $('.pdp-main-content').hide();
            $('.' + _uiState.dataType + '.' + _uiState.uiType).show();
            
        });

        //Helper to update the data (PDB/Nychanis) type state and update the UI
        var _setDataTypeState = Azavea.tryCatch('set data type state', function(dataId) {
            
            // To get the border around the main content, add a dataType class
            _$main.removeClass(_uiState.dataType)
                .addClass(dataId);
                
            _$tabContainer.removeClass(_uiState.dataType)
                .addClass(dataId);
            
            _uiState.dataType = dataId;
            _updateContent();
        });
        
       //Helper to update the UI (Table/Map) type state and update the UI 
        var _setUiTypeState = Azavea.tryCatch('set ui type state', function(uiId) {
            _uiState.uiType = uiId;
            _updateContent();
            
            // Track switching between map and table
            P.Util.trackMetric('Application', 'UI State', uiId);
        });
            
        //Sets all of the important heights so that we always use all of the
        //vertical height but never have scrollbars (ie. a border layout of sorts).
        var _updateLayoutHeight = Azavea.tryCatch('update layout height', function($content, $header, $window, $toolbar) {
            var h = $header.outerHeight();
            var w = $window.height();
            
            $content.outerHeight(w - h);
            _$main.outerHeight(w - h - $toolbar.outerHeight());
            _$tabContent.outerHeight(w - h - $toolbar.outerHeight());
        });
        
        //Caches the main layout elements and initializes the heights to
        //always use all of the vertical height but never have scrollbars
        var _initLayoutHeight = Azavea.tryCatch('init layout height', function() {
            var $header = $('#header');
            var $content = $('#content');
            var $toolbar = $('#pdp-main-toolbar');
            var $window = $(window);
            
            _updateLayoutHeight($content, $header, $window, $toolbar);
            $window.resize(function() {
                _updateLayoutHeight($content, $header, $window, $toolbar);
            });
        });
        
        //Init the Nychanis and PDB tabs
        var _initTabs = Azavea.tryCatch('init layout tabs', function(){
            //Hide all of the tab content
            $(_options.tabTarget + ' .pdp-tab-content').hide();
            
            //Show the content for the first tab
            $(_options.tabTarget + ' .pdp-tab-content:first').show();
            
            //Activate the first tab
            $(_options.tabTarget + ' .pdp-tab:first').addClass('active');

            // Save tab state to be able to switch between tabs on click
            $(_options.tabTarget + ' .pdp-tab a').click(function() {
                var previousId = $(_options.tabTarget + ' .pdp-tab.active').attr('id');
                
                $(_options.tabTarget + ' .pdp-tab').removeClass('active');
                $(this).parent().addClass('active');
                
                var $currentTab = $($(this).attr('href'));
                var currentId = $currentTab.attr('id');
                if (previousId !== currentId) {
                    $(_options.tabTarget + ' .pdp-tab-content').hide();
                    $currentTab.show();
                    
                    _setDataTypeState(currentId);
                }
                return false;
            });
        });
        
        //Init the Table/Map radio button
        var _initViewToolbar = Azavea.tryCatch('init data view picker', function(){
            $(_options.dataViewPickerTarget).buttonset();

            $('label', _options.dataViewPickerTarget)
                .click(function(event) {
                    _setUiTypeState($(this).attr('for'));
                });
        });
        
        var _initNoDataAlert = Azavea.tryCatch('init no data alerts', function(){
            $(P.Nychanis).bind('pdp-data-response', function(event, data) {
                if (!data.Values || !data.Values.length) {
                    P.Util.quickAlert('No results matched your search');
                }
            });
            
            $(P.Pdb).bind('pdp-data-response', function(event, data) {
                if (!data.TotalResults) {
                    P.Util.quickAlert('No results matched your search');
                }
            });
        });
        
        _self.getAppUrl = Azavea.tryCatch('get app url', function(){
            return _options.appUrl;
        });
        
        _self.init = Azavea.tryCatch('init app', function() {
            _$main = $('#pdp-main');
            _$tabContainer = $('#pdp-tab-container');
            _$tabContent = $('.pdp-tab-content-container');
            
            //A widget to show that something is happening.
            P.Widget.LoadingIndicator({
                delay: 100
            }).init();
            
            $(_options.bindTo).trigger('pdp-loading-indicator-request');
            
            // Sign-up widget setup
            PDP.Widget.Signup({
                target: '#signup'
            }).init();
            
            // Login widget setup
            PDP.Widget.Login({ 
                target: '#login',
                profileUrl: 'user/profile.aspx',
                logoutUrl: 'default.aspx',
                adminUrl: 'admin/manage-users.aspx',
                appUrl: _options.appUrl
            }).init();

                                
            _initLayoutHeight();
            _initTabs();
            _initViewToolbar();
            _updateContent();
            _setDataTypeState(_uiState.dataType);
            _initNoDataAlert();

            //Dark lord of all PDB results
            PDP.Pdb.Results({ 
                tableTarget: '#pdp-pdb-table-data',
                tablePagerTarget: '#pdp-pdb-table-pager',
                columnSelectTarget: '#pdp-pdb-table-col-selector',
                exportTarget: '#pdp-pdb-table-export',
                mapTitleTarget: '#pdp-map-title-content',
                tableTitleTarget: '#pdp-pdb-table-toolbar'                
            }).init();
     
            //Dark lord of all PDB searches
            PDP.Pdb.Search({ 
                target: '#pdp-pdb-view'
            }).init();
            
            //Dark lord of all Nychanis searches
            PDP.Nychanis.Search({ 
                target: '#pdp-nychanis-view'
            }).init();

            //Dark lord of all Nychanis results
            PDP.Nychanis.Results({ 
                tableTarget: '#pdp-nychanis-table-data',
                tablePagerTarget: '#pdp-nychanis-table-pager',
                exportTarget: '#pdp-nychanis-table-export',
                mapTitleTarget: '#pdp-map-title-content',
                tableTitleTarget: '#pdp-nychanis-table-toolbar'
            }).init();

            // If google is gone, tell the user the map isn't working.  Tables are ok though.
            try{
                //Lord of the Map - both Nychanis and PDB
                P.Widget.Map({
                    target: '#pdp-map-content'
                }).init();
            }
            catch(err){
                Azavea.log(err);
                P.Util.alert('Google Maps is currently unavailable.  You will not be able to view any map data, however, your search results will still be displayed in the table view.  \nPlease try refreshing your browser to reload Google Maps.', 'Google Maps Unavailable');
            }
            
            // Broadcast login status to any widgets listening
            P.Util.initLoginStatus();   
            
            //A nifty little widget to make sure that panels are
            //mutually exclusive.
            P.Widget.PanelCloser().init();
                        
            // Setup Feedbacker of doom
            var f = Feedbacker.init({
                    orientation: 'left',
                    css: {
                        'z-index': 9999, 
                        bottom: '40px'
                         },
                    onSuccess: function(){
                        P.Util.quickAlert('Thank you for sending your feedback!', 'Feedback Submitted');
                    } 
                });
            
            // A bit of magic here, to ensure that everything is lined up correctly
            $(window).resize();
            
            // Everything is set up, display the splash screen if needed
            P.Widget.Splash({
                backgroundOpacity: 0.5
            }).init();
            
            return _self;
        });
        
        return _self;
    };
}(PDP));