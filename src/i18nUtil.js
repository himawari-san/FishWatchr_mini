class I18nUtil {
    constructor(language) {
	this.banana = new Banana(language);
    }

    
    load(languages){
	return Promise.all(languages.map((language) => {
	    return fetch('i18n/' + language + '.json',
			 {cache: 'no-store'})
		.then((response) => response.json())
		.then((messages) => {
		    this.banana.load(messages, language);
		});
	}));
    }

    
    setLocale(language){
	this.banana.setLocale(language);
    }

    
    get(key){
	return this.banana.i18n(key);
    }
}
