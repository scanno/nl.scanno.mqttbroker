# MQTT Broker for Homey

This app uses the Mosca nodejs library: https://github.com/mcollina/mosca

This app is a nodejs based MQTT broker. When installed this can be used with the Owntracks client, MQTT client and other 
apps that use the MQTT protocol to communicate with Homey. When using this app there is no need to use a cloud based
MQTT broker or host a broker on a homeserver.

After installing the app, please go to the settings page and enter a port number (usually 1883) where the broker should listen on.
Also add users that can have access to the broker.

Things like TLS and topic based ACL's will be added later on.

**If you like this app, then consider to buy me a beer :)**

[![](https://www.paypalobjects.com/en_US/NL/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=scanno71%40gmail%2ecom&lc=NL&item_name=Homey%20MQTT%20%2f%20Owntracks%20apps&currency_code=EUR&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHosted)

