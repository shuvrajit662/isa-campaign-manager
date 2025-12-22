// --- Schemas ---
export const SCHEMA_ESCALATION = JSON.stringify({
    "name": "submit_intent_analysis",
    "description": "Submits the structured analysis of customer intent and a summary based on a conversation thread.",
    "strict": true,
    "parameters": {
        "type": "object",
        "properties": {
            "committed_use": {
                "type": "object",
                "description": "Assessment of whether the customer is interested in a committed use agreement.",
                "properties": {
                    "value": { "type": "boolean", "description": "True if interest is detected, otherwise false." },
                    "reason": { "type": "string", "description": "The explanation for the assessment value." }
                },
                "additionalProperties": false,
                "required": ["value", "reason"]
            },
            "custom_porting": {
                "type": "object",
                "description": "Assessment of whether the customer requires custom or special porting.",
                "properties": {
                    "value": { "type": "boolean", "description": "True if interest is detected, otherwise false." },
                    "reason": { "type": "string", "description": "The explanation for the assessment value." }
                },
                "additionalProperties": false,
                "required": ["value", "reason"]
            },
            "thread_summary": { "type": "string", "description": "A concise summary of the context, requests, and details present in the conversation thread." },
            "sip_trunk_increase": {
                "type": "object",
                "description": "Assessment of whether the customer wants to increase SIP trunks or CPS.",
                "properties": {
                    "value": { "type": "boolean", "description": "True if interest is detected, otherwise false." },
                    "reason": { "type": "string", "description": "The explanation for the assessment value." }
                },
                "additionalProperties": false,
                "required": ["value", "reason"]
            },
            "proserv_interest_detected": {
                "type": "object",
                "description": "Assessment of whether the customer has indicated interest in purchasing professional services.",
                "properties": {
                    "value": { "type": "boolean", "description": "True if interest is detected, otherwise false." },
                    "reason": { "type": "string", "description": "The explanation for the assessment value." }
                },
                "additionalProperties": false,
                "required": ["value", "reason"]
            },
            "_debug_metadata": {
                "type": "object",
                "description": "Internal metadata regarding the analysis execution.",
                "properties": {
                    "last_run": { "type": "string", "description": "The timestamp of when the analysis was last run." },
                    "status": { "type": "string", "description": "The operational status of the analysis run (e.g., 'fresh')." }
                },
                "additionalProperties": false,
                "required": ["last_run", "status"]
            }
        },
        "additionalProperties": false,
        "required": [
            "committed_use",
            "custom_porting",
            "thread_summary",
            "sip_trunk_increase",
            "proserv_interest_detected",
            "_debug_metadata"
        ]
    }
}, null, 2);

export const SCHEMA_PROMPT_BUILDER = JSON.stringify({
    "name": "generate_system_prompt",
    "description": "Constructs a system prompt.",
    "strict": true,
    "parameters": {
        "type": "object",
        "properties": {
            "system_prompt": { "type": "string", "description": "The generated prompt text." },
            "reasoning": { "type": "string", "description": "Explanation of the prompt strategy." }
        },
        "required": ["system_prompt", "reasoning"],
        "additionalProperties": false
    }
}, null, 2);

export const SCHEMA_TOOL_EXEC = JSON.stringify({
    "name": "execute_tool",
    "description": "Result of tool execution.",
    "strict": true,
    "parameters": {
        "type": "object",
        "properties": {
            "status": { "type": "string", "enum": ["success", "failed"] },
            "data": { "type": "object", "additionalProperties": true }
        },
        "required": ["status", "data"],
        "additionalProperties": false
    }
}, null, 2);

export const SCHEMA_GUARDRAIL = JSON.stringify({
    "name": "guardrail_check",
    "description": "Validation result of the response.",
    "strict": true,
    "parameters": {
        "type": "object",
        "properties": {
            "status": { "type": "string", "enum": ["passed", "failed"] },
            "score": { "type": "number" },
            "checks": { 
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "check": { "type": "string" },
                        "passed": { "type": "boolean" }
                    },
                    "required": ["check", "passed"],
                    "additionalProperties": false
                }
            }
        },
        "required": ["status", "score", "checks"],
        "additionalProperties": false
    }
}, null, 2);

export const SCHEMA_STATE = JSON.stringify({
    "name": "update_state",
    "description": "Updates conversation state.",
    "strict": true,
    "parameters": {
        "type": "object",
        "properties": {
            "conversation_id": { "type": "string" },
            "status": { "type": "string" },
            "last_action": { "type": "string" },
            "timestamp": { "type": "string" }
        },
        "required": ["conversation_id", "status", "last_action", "timestamp"],
        "additionalProperties": false
    }
}, null, 2);

export const SCHEMA_FINAL = JSON.stringify({
    "name": "generate_html_email",
    "description": "Generates the final HTML email.",
    "strict": true,
    "parameters": {
        "type": "object",
        "properties": {
            "email_html_body": { "type": "string" }
        },
        "required": ["email_html_body"],
        "additionalProperties": false
    }
}, null, 2);
