// taskTypes.js
import DefaultSource from './leftside/DefaultSource';
import TableSource from './leftside/TableSource';
import DefaultAnswer from './rightside/DefaultAnswer';
import MultipleChoiceAnswer from './rightside/MultipleChoiceAnswer';
import MultipleSelectAnswer from './rightside/MultipleSelectAnswer';



export const taskTypes = {
    rovid_valasz: {
        Source: DefaultSource,
        Answer: DefaultAnswer,
    },
    tobb_opcio: {
        Source: DefaultSource,
        Answer: MultipleChoiceAnswer,
    },
    tablazatos_feladat: {
        Source: TableSource,
        Answer: DefaultSource,
    },
    tobb_valasz: {
        Source: DefaultSource,
        Answer: MultipleSelectAnswer,
    },
    
};

export const fallbackType = {
    Source: DefaultSource,
    Answer: DefaultAnswer,
};