// Full IRB-approved consent form text — English, French, and Kinyarwanda
// Source: docs/Leukemia consent form.pdf / .docx

export const CONSENT_TEMPLATE = {
  en: {
    title: 'Informed Consent Form',
    studyTitle: 'Study Title: Characterization of Omics Perturbations Driving Leukemia in the Rwandan Population',
    sections: [
      {
        key: 'intro',
        heading: 'Introduction and Voluntary Consent',
        body: `Good morning,

I am Esperance UMUMARARUNGU, the Director of the Molecular and Genomics Unit at the National Reference Laboratory in Rwanda. I am collaborating with researchers from the University of Rwanda and the University of Liège in Belgium on a study focusing on the characterization of omics perturbations driving leukemia in the Rwandan population.

The purpose of this research is to identify key genetic, epigenetic, and molecular changes involved in leukemia development in Rwanda. By understanding the biological mechanisms behind this disease, we aim to improve diagnosis and treatment strategies.

You have been invited to participate in this study due to its significance in enhancing health outcomes in Rwanda. The study has received authorization from the Ethics Committee of the College of Medicine and Health Sciences and the CHUK Ethical Committee. Your participation is voluntary, and you can choose not to participate or withdraw at any time without consequences for you or your family. We will provide you with all necessary information to help you make an informed decision.`,
      },
      {
        key: 'purpose',
        heading: 'A. Purpose of the Research',
        body: 'The aim of this research is to characterize the molecular and genomic changes associated with leukemia among the Rwandan population. Through genomic and epigenomic analyses, we hope to gain insights into the disease and its potential drivers, which will enable the development of personalized treatment approaches.',
      },
      {
        key: 'selection',
        heading: 'B. Selection for participation/of participants',
        body: 'You have been invited because you are a leukemia patient in Rwanda. Your participation will contribute to a better understanding of the genetic drivers of leukemia, which could lead to improved diagnostics and treatments. Please take your time to decide, and feel free to discuss this with family or friends. Your participation is voluntary, and your privacy will be strictly protected.',
      },
      {
        key: 'role',
        heading: 'C. Contribution/Role of a participant to the Research',
        body: `If you choose to participate, we will collect the following:
• A blood sample (10 ml)
• A bone marrow sample, if applicable, as part of your routine medical care
• Clinical information about your leukemia diagnosis and treatment history

Your samples will be anonymized to ensure that you cannot be personally identified. Some tests will be conducted in Rwanda, while others may be performed in collaboration with partner institutions abroad.`,
      },
      {
        key: 'dataProtection',
        heading: 'D. Samples and Data use and protection',
        body: 'Your samples will be analyzed to study genetic mutations and changes in gene expression associated with leukemia. These analyses will help identify potential biomarkers for diagnosis and treatment. The data will be used for this research and may be shared with other researchers globally under strict regulations. We ensure that your data will be anonymized and only accessible to the research team. It will not be shared with unauthorized persons or used for other purposes without your explicit consent. Your data will not be sold or used for profit.',
      },
      {
        key: 'duration',
        heading: 'E. Duration of the Research',
        body: 'Your direct participation involves providing the required samples and information. However, the analysis of your DNA and data may continue for several years as part of ongoing research efforts. Your data and samples may also be used in future research studies.',
      },
      {
        key: 'benefits',
        heading: 'F. Benefits of Participation',
        body: 'While there is no direct benefit to you, your participation will contribute to the global understanding of leukemia and may help future patients receive better care and treatment.',
      },
      {
        key: 'risks',
        heading: 'G. Risks Involved',
        body: 'There are minimal risks associated with this research. Blood and bone marrow sample collection may cause discomfort or bruising at the site, but precautions will be taken to minimize these risks.',
      },
      {
        key: 'voluntary',
        heading: 'I. Voluntary Participation',
        body: 'Your participation is entirely voluntary. You may withdraw at any time without explanation or consequences. You do not need to answer any questions you are uncomfortable with, and you can stop participating at any time.',
      },
      {
        key: 'results',
        heading: 'J. Result Dissemination',
        body: 'You will receive a summary of the overall study results, which will reflect findings for all participants, not individual results. If any significant findings related to your health are discovered, we will contact you to inform you, provided you express an interest in receiving such information.',
      },
      {
        key: 'compensation',
        heading: 'K. Participation Compensation',
        body: 'Participants will not receive direct financial compensation, but transport costs will be reimbursed, and you will receive a small sum of 5,000 RWF for your time.',
      },
      {
        key: 'contact',
        heading: 'L. Contact for Further Information',
        body: `For any questions regarding this study, please contact:
• Esperance UMUMARARUNGU: (+250) 788287222
• Prof. Florence Masaisa, Hematologist at CHUK: (+250) 788650009`,
      },
    ],
    consentStatement: 'I have been provided all the required information and I understand my role in this study. I understand that I can withdraw from this study at any time without consequences. I consent to participate in this study.',
    participantLabel: 'Name of the participant',
    researcherLabel: 'Name of the researcher',
    signatureAndDate: 'Signature and Date',
    doneAt: 'Done at',
  },

  fr: {
    title: 'Formulaire de consentement éclairé',
    studyTitle: 'Étude : Caractérisation des perturbations omiques à l’origine de la leucémie dans la population rwandaise',
    sections: [
      {
        key: 'intro',
        heading: 'Introduction et consentement volontaire',
        body: `Bonjour,

Je suis Esperance UMUMARARUNGU, Directrice de l’Unité de Biologie Moléculaire et Génomique au Laboratoire National de Référence du Rwanda. Je collabore avec des chercheurs de l’Université du Rwanda et de l’Université de Liège en Belgique sur une étude portant sur la caractérisation des perturbations omiques à l’origine de la leucémie dans la population rwandaise.

L’objectif de cette recherche est d’identifier les changements génétiques, épigénétiques et moléculaires clés impliqués dans le développement de la leucémie au Rwanda. En comprenant les mécanismes biologiques de cette maladie, nous espérons améliorer les stratégies de diagnostic et de traitement.

Vous êtes invité(e) à participer à cette étude en raison de son importance pour l’amélioration des résultats de santé au Rwanda. L’étude a reçu l’autorisation du Comité d’Éthique du Collège de Médecine et des Sciences de la Santé et du Comité d’Éthique du CHUK. Votre participation est volontaire et vous pouvez choisir de ne pas participer ou de vous retirer à tout moment sans conséquence pour vous ou votre famille. Nous vous fournirons toutes les informations nécessaires pour vous aider à prendre une décision éclairée.`,
      },
      {
        key: 'purpose',
        heading: 'A. Objectif de la recherche',
        body: 'Cette recherche vise à caractériser les changements moléculaires et génomiques associés à la leucémie dans la population rwandaise. Grâce à des analyses génomiques et épigénomiques, nous espérons mieux comprendre la maladie et ses facteurs déclenchants potentiels, ce qui permettra de développer des approches thérapeutiques personnalisées.',
      },
      {
        key: 'selection',
        heading: 'B. Sélection des participants',
        body: 'Vous avez été invité(e) car vous êtes un(e) patient(e) atteint(e) de leucémie au Rwanda. Votre participation contribuera à une meilleure compréhension des facteurs génétiques de la leucémie, ce qui pourrait améliorer les diagnostics et les traitements. Prenez le temps de décider et n’hésitez pas à en discuter avec votre famille ou vos amis. Votre participation est volontaire et votre vie privée sera strictement protégée.',
      },
      {
        key: 'role',
        heading: 'C. Rôle du participant dans la recherche',
        body: `Si vous choisissez de participer, nous collecterons :
• Un échantillon sanguin (10 ml)
• Un échantillon de moelle osseuse, le cas échéant, dans le cadre de votre suivi médical de routine
• Des informations cliniques sur votre diagnostic de leucémie et votre historique de traitement

Vos échantillons seront anonymisés afin que vous ne puissiez pas être identifié(e) personnellement. Certains tests seront réalisés au Rwanda, d’autres pourront être effectués en collaboration avec des institutions partenaires à l’étranger.`,
      },
      {
        key: 'dataProtection',
        heading: 'D. Utilisation et protection des échantillons et données',
        body: 'Vos échantillons seront analysés pour étudier les mutations génétiques et les modifications de l’expression génique associées à la leucémie. Ces analyses aideront à identifier des biomarqueurs potentiels pour le diagnostic et le traitement. Les données seront utilisées pour cette recherche et pourront être partagées avec d’autres chercheurs dans le monde sous réglementation stricte. Nous garantissons que vos données seront anonymisées et accessibles uniquement à l’équipe de recherche. Elles ne seront pas partagées avec des personnes non autorisées ni utilisées à d’autres fins sans votre consentement explicite. Vos données ne seront pas vendues ni utilisées à des fins lucratives.',
      },
      {
        key: 'duration',
        heading: 'E. Durée de la recherche',
        body: 'Votre participation directe consiste à fournir les échantillons et informations requis. Toutefois, l’analyse de votre ADN et de vos données peut se poursuivre pendant plusieurs années dans le cadre des efforts de recherche continus. Vos données et échantillons pourront également être utilisés dans des études futures.',
      },
      {
        key: 'benefits',
        heading: 'F. Bénéfices de la participation',
        body: 'Bien qu’il n’y ait pas de bénéfice direct pour vous, votre participation contribuera à la compréhension globale de la leucémie et pourra aider les futurs patients à recevoir de meilleurs soins et traitements.',
      },
      {
        key: 'risks',
        heading: 'G. Risques encourus',
        body: 'Les risques associés à cette recherche sont minimes. Le prélèvement d’échantillons sanguins et de moelle osseuse peut provoquer un inconfort ou des ecchymoses au site de prélèvement, mais des précautions seront prises pour minimiser ces risques.',
      },
      {
        key: 'voluntary',
        heading: 'I. Participation volontaire',
        body: 'Votre participation est entièrement volontaire. Vous pouvez vous retirer à tout moment sans explication ni conséquence. Vous n’êtes pas tenu(e) de répondre aux questions qui vous mettent mal à l’aise et vous pouvez cesser de participer à tout moment.',
      },
      {
        key: 'results',
        heading: 'J. Diffusion des résultats',
        body: 'Vous recevrez un résumé des résultats globaux de l’étude, reflétant les conclusions pour tous les participants, pas les résultats individuels. Si des résultats significatifs liés à votre santé sont découverts, nous vous contacterons pour vous en informer, à condition que vous ayez exprimé le souhait de recevoir ces informations.',
      },
      {
        key: 'compensation',
        heading: 'K. Compensation de la participation',
        body: 'Les participants ne recevront pas de compensation financière directe, mais les frais de transport seront remboursés, et vous recevrez une petite somme de 5 000 RWF pour votre temps.',
      },
      {
        key: 'contact',
        heading: 'L. Contact pour informations complémentaires',
        body: `Pour toute question concernant cette étude, veuillez contacter :
• Esperance UMUMARARUNGU : (+250) 788287222
• Pr. Florence Masaisa, Hématologue au CHUK : (+250) 788650009`,
      },
    ],
    consentStatement: 'J’ai reçu toutes les informations requises et je comprends mon rôle dans cette étude. Je comprends que je peux me retirer de cette étude à tout moment sans conséquence. Je consens à participer à cette étude.',
    participantLabel: 'Nom du participant',
    researcherLabel: 'Nom du chercheur',
    signatureAndDate: 'Signature et date',
    doneAt: 'Fait à',
  },

  ki: {
    title: 'Urupapuro rwo kwemera kugira uruhare mu bushakashatsi',
    studyTitle: "Izina Ry’ubushakashatsi: Isesengura ry’ihindagurika muturemangingo zitera kanseri y’amaraso (leukemia) mu baturage b’u Rwanda",
    sections: [
      {
        key: 'intro',
        heading: "Intangiriro, amakuru ya ngombwan’uburenganzira bwo kwemera cyangwa kwanga kwitabira",
        body: `Muraho neza,

Nitwa Esperance UMUMARARUNGU, Umuyobozi w’Ishami rishinzwe ipimwa ry“uturemangingo muri Laboratwari nkuru y’Igihugu (National Reference Laboratory) ibarizwa mu Kigo cy’Igihugu gishizwe Ubuzima (Rwanda Biomedical Center).

Ubushakashatsi bwacu bufite intego yo kumenya neza impinduka zitera kanseri y’amaraso (leukemia) mu baturage b’u Rwanda. Nkorana n’abashakashatsi b’Abanyarwanda, barimo abo muri Kaminuza y’u Rwanda, ndetse n’abashakashatsi b’Ababiligi bo muri Kaminuza ya Liège.

Ubushakashatsi bwacu bugamije kumenya neza impinduka zitera iyi ndwara kugira ngo dushobore kunoza uburyo bwo kuyipima no kuyivura.

Wahiswemo kugira uruhare muri ubu bushakashatsi kuko byitezwe ko buzagira ingaruka nziza ku buzima bw’abaturage b’u Rwanda. Ubushakashatsi bwemejwe na Komite y’Ubuvuzi n’Ubuzima ya Koleji ya Medicine na Komite y’Ubuvuzi ya CHUK. Kwitabira si itegeko, kandi ushobora guhitamo kutitabira cyangwa ukava mu bushakashatsi igihe ari cyo cyose nta ngaruka bikugizeho cyangwa bigize ku muryango wawe. Mbere yo gufata umwanzuro, turifuza kuguha amakuru yose akenewe yerekeye ubu bushakashatsi.`,
      },
      {
        key: 'purpose',
        heading: "A. Intego y’ubu bushakashatsi",
        body: "Intego y’ubu bushakashatsi ni kumenya impinduka zishobora guteza kanseri y’amaraso (leukemia) mu baturage b’u Rwanda. Tuzakora isesengura ry’uturemangingo kugira ngo tumenye imvano nyakuri y’iyi ndwara, kandi ibyo bizadufasha mu gushaka uburyo bwihariye bwo kuvura abarwayi kugira ngo bagire imibereho myiza. Amakuru azakusanywa azabikwa kandi azakoreshwa gusa mu bushakashatsi buri kubaho n’ubuzaza.",
      },
      {
        key: 'selection',
        heading: 'B. Guhitamo uwitabira ubu bushakashatsi',
        body: "Wahiswemo kwitabira kuko uri muri bamwe bafite kanseri y’amaraso mu Rwanda. Uruhare rwawe ruzadufasha kumenya impamvu zitera kanseri, bizanadufasha kuvura no gupima neza iyi ndwara. Wemerewe umwanya wo kwifata umwanzuro, kandi wemere kugisha inama abo mu muryango wawe cyangwa inshuti mbere yo gufata icyemezo. Kwitabira ni ubushake bwawe, kandi umutekano wawe n’ibanga ryawe bizacungwa neza.",
      },
      {
        key: 'role',
        heading: 'C. Urahare muri ubu bushakashatsi',
        body: `Niwemera kwitabira, hazakusanywa ibi bikurikira:
• Gufatwa amaraso (mililitiro 10)
• Gufatwa ikizaminin cyo mumusokoro niba ari ngombwa, nk’igice cy’ubuvuzi busanzwe
• Amakuru yerekeye ubuvuzi bwawe, aho waherewe ubuvuzi no ku ivuriro ryawe

Ibizamini byawe bizagirwa ibanga, ku buryo nta muntu uzabasha kukumenya. Ibipimo bimwe bizakorerwa mu Rwanda, ibindi bishobora gukorerwa ku bufatanye n’ibigo by’amahanga.`,
      },
      {
        key: 'dataProtection',
        heading: "D. Akamaro k’ibizamini n’amakuru yawe n’umutekano wabyo.",
        body: "Ibizamini byawe bizasuzumwa kugira ngo hasuzumwe uturema ngingo dufitanye isano na kanseri y’amaraso. Ibisubizo bizadufasha kumenya ibimenyetso bishobora kwifashishwa mu kugena uburyo bwo gupima no kuvura. Amakuru azakoreshwa muri ubu bushakashatsi kandi ashobora gusangirwa n’abandi bashakashatsi ku rwego mpuzamahanga, ariko bikurikije amategeko yokwita k’umutekano n’ibanga ryawe. Nta makuru yawe azagurishwa cyangwa akoreshwe ku nyungu bwite.",
      },
      {
        key: 'duration',
        heading: 'E. Igihe bushakashatsi buzamara',
        body: "Isesengura ry’ADN n’amakuru yawe rizakomeza igihe kirekire mu rwego rw’ubushakashatsi buhoraho. Amakuru n’ibizamini byawe bizashobora gukoreshwa no mu bushakashatsi mugihe kizaza.",
      },
      {
        key: 'benefits',
        heading: 'F. Akamaro ko kwitabira ubu bushakashatsi',
        body: "Ntabwo hari inyungu z’umuntu ku giti cye, ariko uruhare rwawe ruzafasha kumenya neza iby’iyi ndwara ya kanseri y’amaraso kandi bizafasha abarwayi bo mu gihe kizaza kubona ubuvuzi bwiza n’ubushakashatsi burambye.",
      },
      {
        key: 'risks',
        heading: 'G. Impungenge zagaragara muri ubu bushakashatsi',
        body: "Hari ibyago bike cyane. Gufata amaraso cyangwa gufata ikizami mu musokoro, bishobora gutera kubabara ahafashwe ikizamini, ariko hazakorwa ibishoboka byose kugirango ibyo byago ntibibe.",
      },
      {
        key: 'voluntary',
        heading: 'I. Kwitabira ubushakashatsi',
        body: "Kwitabira ni ubushake bwawe kandi ushobora guhagara igihe icyo ari cyo cyose ubyifuje kandi nta ngaruka uzagira. Ntuzasabwa gusubiza ibibazo udashaka, kandi ushobora gukuramo uruhare rwawe igihe cyose.",
      },
      {
        key: 'results',
        heading: "J. Ibijyanye n’amakuru y’ibizava muri ubu bushakashatsi",
        body: "Uzahabwa ishusho rusange y’ibizava muri ubu bushakashatsi izerekana ibijyanye n’itsinda ry’abitabiriye bose. Niba hari ibimenyetso bifatika byerekeranye n’ubuzima bwawe, uzabimenyeshwa.",
      },
      {
        key: 'compensation',
        heading: 'K. Ibihembo mukwitabira ubu bushakashatsi',
        body: "Nta gihembo cy’amafaranga kizahabwa, ariko uzishyurwa amafaranga y’ingendo, kandi uzahabwa amafaranga ibihumbi bitanu (5,000 RWF) kubw’igihe cyawe.",
      },
      {
        key: 'contact',
        heading: 'L. Abo wakwegera kugira ngo ukeneye andi makuru',
        body: `Kubibazo bijyanye n’ubu bushakashatsi, wahamagara:
• Esperance UMUMARARUNGU: (+250) 788287222
• Prof. Florence Masaisa, umuganga w’indwara z’amaraso muri CHUK: (+250) 788650009`,
      },
    ],
    consentStatement: "Nahawe amakuru ahagiye n’umva uruhare rwanjye muri ubu bushakashatsi. Ndasobanukiwe ko nshobora gukuramo uruhare rwanjye igihe icyo ari cyo cyose nta ngaruka. Nemeye kwitabira ubu bushakashatsi.",
    participantLabel: "Izina ry’uwitabiriye",
    researcherLabel: "Izina ry’umushakashatsi",
    signatureAndDate: "Igikono n’Itariki",
    doneAt: 'Byakozwe kuri',
  },
};
