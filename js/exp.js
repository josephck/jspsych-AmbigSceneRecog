
//Data
const testing = false; //change this to false for csv loading and actual run

const feedback_msg = {'Correct':'Correct, well done!','Wrong': 'Oops! That was wrong, try again!'}


const block_para_lists = [{
    instruction: "<p>blah blah blah</p>",
    stim_csv: "learn_practice.csv",
    debrief: "<p>blah blah blah</p>",
    feedback:true,
    blocktype: "learn",
    preprocess:null
  },
  {
    instruction: "<p>blah blah blah</p>",
    stim_csv: "learn_stim.csv",
    debrief: "<p>blah blah blah</p>",
    feedback:true,
    blocktype: "learn",
    preprocess:ShuffleCond
  },
  {
    instruction: "<p>blah blah blah</p>",
    stim_csv: "recog_stim.csv",
    debrief: "<p>blah blah blah</p>",
    feedback:false,
    blocktype: "recog",
    preprocess:ShuffleCond
  }
];

const fixation = {
  type: 'html-keyboard-response',
  stimulus: '<p class="stimulus">+</p>',
  choices: jsPsych.NO_KEYS,
  trial_duration: 1000,
  post_trial_gap: 0
}

const instruction_text = '<p>Blah Blah Blah</p>'+
    '<p>Blah Blah Blah Blah</p>';

const recog_inst_text = '<p>Recognition Instruction</p>';

const recog_in_Q_inst_text = '<p>Similarity in meaning?</p>' + 
'<p>1 = very differnt, 4 = very similar</p>';

const debrief_text ="<p>blah blah blah DONE</p>";

//Stim template for testing purpose
const testLearnStim_list = [
  {storyId:1, title:"Testing Story 1", 
  line1:"S1 Line 1 text", line2:"S1 Line 2 text", line3:"S1 Line 3 text",
  wordfrag:"_BC", wordfrag_corAns:"A", 
  compQ:"Comp Q text", compQ_corrAns:"Y"},
  {storyId:2, title:"Testing Story 2", 
  line1:"S2 Line 1 text", line2:"S2 Line 2 text", line3:"S2 Line 3 text",
  wordfrag:"_CD", wordfrag_corAns:"B", 
  compQ:"Comp Q text", compQ_corrAns:"N"}
]

const testRecogStim_list = [
  {storyId:1, title:"Testing Story 1", 
  q1:"S1 Q1", q2:"S1 Q2", q3:"S1 Q3",q4:"S1 Q4"
  },
  {storyId:2, title:"Testing Story 2", 
  q1:"S2 Q2", q2:"S2 Q2", q3:"S2 Q3", q4:"S2 Q4"
  }
]



//Functions
function ShuffleCond(stim_list) {
//return an array that contains multiple trials lists

  return [jsPsych.randomization.repeat(stim_list,1)];
}


function buildInstruction(text) {
  return  {
    type: 'html-keyboard-response', 
    //please refine the instruction below, use <p> and </p> to surround every line"
    stimulus: text +
      '<p>When you are ready to begin, press Y or N.</p>',
    choices: ['y','n']
  }
}

function buildDebrief(text) {
  return {
    type: 'html-keyboard-response',
    stimulus: "<p>blah blah blah DONE</p>" ,
    prompt: "<p>press any key to take a look on the data</p>" 
  }
}
//Promisify
function readAndBuildBlock(block_para) {
  return new Promise(function(resolve, reject){
    Papa.parse(csv_path + block_para.stim_csv,{
      download : true,
      header : true,
  skipEmptyLines: true,
      complete: function(results){
    resolve(buildBlock(block_para, results.data));
      }
    });
  });
}

function buildBlock(block_para, results) {
  function buildSimpleBlock(block_para,results) {
    return {timeline:[buildInstruction(block_para.instruction),
            (block_para.blocktype == 'learn')?learning_trials(results,block_para.feedback):recognition_trials(results),
      buildDebrief(block_para.debrief)]
      }
  }
    var block;
    if (!(typeof block_para.preprocess == "function")) {
      return buildSimpleBlock(block_para,results);
    } else {
      block_list = block_para.preprocess(results);
      var timeline = [];
      block_list.forEach(function(w){
        timeline.push(buildSimpleBlock(block_para,w))
      })
  return {'timeline':timeline} ;
    }
    
}



function genTitleHtml(titletext) {
  return `<div class="title">${titletext}</div>`;
}

function genStoryLineStim(variable_name){
  function genStoryLineStimHtml(variable_name) {
    return genTitleHtml(jsPsych.timelineVariable('title',true)) + 
    `<div class = "stim"><p class ="stim">${jsPsych.timelineVariable(variable_name, true)}</p></div>`;
  }
  return [{
    type: 'html-keyboard-response',
    stimulus: function(){return genStoryLineStimHtml(variable_name)},
    choices:jsPsych.NO_KEYS,
    trial_duration: 1000
  }, {
    type: 'html-keyboard-response',
    stimulus: function(){return genStoryLineStimHtml(variable_name)},
    prompt: '<div class = "prompt">(press spacebar to continue)</div>',
    choices: ' ',
    trial_duration: null,
    response_ends_trial: true
  }
]
}

function learning_trials(stimuli, feedback  = false) {
  result = {
    timeline_variables: stimuli,
    randomize_order: true,
    timeline: [
      fixation,
      { //show title for 2000ms
        type: 'html-keyboard-response',
        stimulus: function(){return genTitleHtml(jsPsych.timelineVariable('title',true))},
        choices: jsPsych.NO_KEYS,
        trial_duration: 2000,
      }
      
    ]
  }

  //add storylines
  result.timeline = result.timeline.concat(genStoryLineStim("line1"));
  result.timeline = result.timeline.concat(genStoryLineStim("line2"));
  result.timeline = result.timeline.concat(genStoryLineStim("line3"));

  //add wordfrag response elements
  result.timeline = result.timeline.concat([{
      type: 'html-keyboard-response',
      stimulus: function(){return `<div class = "wordfrag"><p class = "stim">${jsPsych.timelineVariable('wordfrag',true)}</p></div>`},           
      choices: jsPsych.NO_KEYS,
      trial_duration: 200
    },
    {
      type: 'html-keyboard-response',
      stimulus: function(){return `<div class = "wordfrag"><p class = "stim">${jsPsych.timelineVariable('wordfrag',true)}</p></div>`},           
      prompt: '<div class = "prompt">(press S to continue)</div>',
      choices: ['s'],
      trial_duration: null
    },
    {
      type: 'html-keyboard-response',
      stimulus:  function(){return (`<div class = "wordfrag"><p class = "stim">What was the first missing letter of the word</p></div>`)},           
      prompt: '<div class = "prompt">(respond on keyboard)</div>',
      choices: Array.apply(0, Array(26)).map(function(_,b) { return b + 'A'.charCodeAt(0); }),
      trial_duration: null,
      data: function(){
        return {
          storyId: jsPsych.timelineVariable('storyId',true),
            wordfarg: jsPsych.timelineVariable('wordfrag',true),
            correctAns: jsPsych.timelineVariable('wordfrag_corAns',true)
        }
      },
      on_finish: function(data){
        if (data.key_press == jsPsych.timelineVariable('wordfrag_corAns',true).charCodeAt(0)) {
            data.wordfragCorrect = true; 
        } else {
            data.wordfragCorrect = false;
        }
      }
    }
  ])

  if (feedback) {
    result.timeline.push({
      
      type: 'html-keyboard-response',
        stimulus: function(){ return `<p class='feedback'>${(jsPsych.data.getLastTrialData().values()[0].wordfragCorrect?feedback_msg['Correct']:feedback_msg['Wrong'])}</p>`; },
        trial_duration: 2000
    })
  }

  //add Comprehension questions elements
  result.timeline = result.timeline.concat([{
      type: 'html-keyboard-response',
      stimulus:  function(){return `<div class = "compQ"><p class = "stim">${jsPsych.timelineVariable('compQ',true)}</p></div>`},           
      choices: jsPsych.NO_KEYS,
      trial_duration: 500
    },
    {
      type: 'html-keyboard-response',
      stimulus:  function(){return `<div class = "compQ"><p class = "stim">${jsPsych.timelineVariable('compQ',true)}</p></div>`},           
      prompt: "Press Y for Yes, N for No",
      choices: ['y','n'],
      trial_duration: null,
      data: function(){
        return {
          storyId: jsPsych.timelineVariable('storyId',true),
            wordfarg: jsPsych.timelineVariable('compQ',true),
            correctAns: jsPsych.timelineVariable('compQ_corrAns',true)
        }
      },
      on_finish: function(data){
        if (data.key_press == jsPsych.timelineVariable('compQ_corrAns',true).charCodeAt(0)) {
            data.compQCorrect = true; 
        } else {
            data.compQCorrect = false;
        }
      }
    }
  ])

  if (feedback) {
    result.timeline.push({
      
      type: 'html-keyboard-response',
        stimulus: function(){ return `<p class='feedback'>${(jsPsych.data.getLastTrialData().values()[0].compQCorrect?feedback_msg['Correct']:feedback_msg['Wrong'])}</p>`; },
        trial_duration: 2000
    })
  }


    return result;
}

function recognition_trials(stimuli) {
  function genRecogQStimHtml(qid) {
    return genTitleHtml(jsPsych.timelineVariable('title',true)) + 
    `<div class = "stim"><p class = "stim">${jsPsych.timelineVariable(qid,true)}</p></div>`
  }
  function genRecogQStim(qid) {
    return [{
        type: 'html-keyboard-response',
        stimulus: function(){return genRecogQStimHtml(qid)},
        choices: jsPsych.NO_KEYS,
        trial_duration: 1000
      },
      {
        type: 'html-keyboard-response',
        stimulus: function(){return genRecogQStimHtml(qid)},
        choices: ['1','2','3','4'],
        prompt: '<div class = "prompt">' + recog_in_Q_inst_text + '</div>',
        trial_duration: null,
        data: function(){
          return {
            storyId: jsPsych.timelineVariable('storyId',true),
            qid: qid
          }
        },
        on_finish: function(data){
          data.ans = String.fromCharCode(data.key_press)
        }
      }
    ]
  }

  result = {
    timeline_variables: stimuli,
    randomize_order: true,
    timeline: [
      fixation,
      { //show title for 2000ms
        type: 'html-keyboard-response',
        stimulus: function(){return genTitleHtml(jsPsych.timelineVariable('title',true))},
        choices: jsPsych.NO_KEYS,
        trial_duration: 2000
      },
      {
        type: 'html-keyboard-response',
        stimulus: function(){return genTitleHtml(jsPsych.timelineVariable('title',true)) + 
        `<div class = "recog_inst"><p class = "stim">${recog_inst_text}</p></div>`},
        choices: jsPsych.NO_KEYS,
        trial_duration: 2000,
      }
      
    ]
  }
  result.timeline = result.timeline.concat(genRecogQStim('q1'))
  result.timeline = result.timeline.concat(genRecogQStim('q2'))
  result.timeline = result.timeline.concat(genRecogQStim('q3'))
  result.timeline = result.timeline.concat(genRecogQStim('q4'))
  return result
}


//Enviornment constant and variables
const csv_path = "./csv/";
let promises = [];
var timeline = [];



//main()
if (!testing) {
  for (const block_para of block_para_lists) {
    promises.push(readAndBuildBlock(block_para));
  }
  
  
  
  Promise.all(promises).then(function(){
    timeline.push(buildInstruction(instruction_text));
    for(const block of arguments[0]) {
      timeline.push(block);
    }
    timeline.push(buildDebrief(debrief_text));
    jsPsych.init({
      timeline: timeline,
      on_finish: function() {
          jsPsych.data.displayData();
      },
      default_iti: 0
    });
  
  })
} else {
  timeline.push(buildInstruction(instruction_text));
  timeline.push(learning_trials(testLearnStim_list, feedback = true));
  timeline.push(recognition_trials(testRecogStim_list));
  timeline.push(buildDebrief(debrief_text));
  jsPsych.init({
    timeline: timeline,
    on_finish: function() {
        jsPsych.data.displayData();
    },
    default_iti: 0
  });
}
