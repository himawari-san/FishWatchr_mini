# FishWatchr Mini
FishWatchr Mini is an educational observation support tool for mobile devices. Students can observe educational activities such as presentation exercises by using the tool through Web browsers on their own mobile phones. The observation results of all students are merged on a FishWatchr Mini server, and can be displayed in histogram/table format.
 Moreover, The annotation data can be exported to FishWatchr, which is a video annotation system, synchronizing with the video data of the activity.

# Requirements
* HTML5 + JavaScript (client)
* PHP (server)
* [Bootstrap (ver.1.5 or later)](https://getbootstrap.jp/)
* [C3 (ver.0.7.20 or later)](http://c3js.org/)
* [D3 (ver.6.7.0 or later)](https://github.com/d3/d3)
* [Hotkeys](https://github.com/jaywcjlove/hotkeys)
* [QRCode.js](https://github.com/davidshimjs/qrcodejs)
* [banana-i18n](https://github.com/wikimedia/banana-i18n)


# Demo and User Manual
- Visit [https://csd.ninjal.ac.jp/f/m.html](https://csd.ninjal.ac.jp/f/m.html) to try FishWatchr Mini!
- [Japanese User Manual](http://www2.ninjal.ac.jp/lrc/index.php?%B4%D1%BB%A1%BB%D9%B1%E7%A5%C4%A1%BC%A5%EB%20FishWatchr%2FMini) 

# Install
1. Put files included in the src directory to a directory (FWM_DIR) in a Web server.
2. Install Bootstrap, C3, D3, Hotkeys, QRCode.js and banana-i18n into jss directory.
    * bootstrap.bundle.min.js, bootstrap.min.css
    * c3.min.js, c3.min.css
    * d3.min.js
	* banana-i18n.js
	* hotkeys.min.js
	* qrcode.min.js
3. Write .ht_fw_mini.inc based on sample.ht_fw_mini.inc, and put it in FWM_DIR.
4. Set up directories in the Web server based on the .ht_fw_mini.inc.

# Licence
GNU GPL v3
