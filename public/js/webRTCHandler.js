import * as wss from './wss.js';


export const sendPreOffer = (callType, caleePersonalCode) => {
    const data = {
        callType,
        caleePersonalCode
    };
    wss.sendPreOffer(data);
};

export const handlePreOffer = (data) => {
    console.log('pre offer came webRTC handler');
    console.log(data);
};
