// taskTypes.js
import DefaultSource from './leftside/DefaultSource';
import DefaultAnswer from './rightside/DefaultAnswer';


export const taskTypes = {
    rovid_valasz: {
        Source: DefaultSource,
        Answer: DefaultAnswer,
    },
    
};

export const fallbackType = {
    Source: DefaultSource,
    Answer: DefaultAnswer,
};