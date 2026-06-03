import { NextResponse } from 'next/server';

export async function GET() {
  const spec = {
    openapi: "3.0.0",
    info: {
      title: "MySaaS Developer Hub API",
      description: "High-performance developer APIs for document formatting, image transcoding, and PDF compilation. Browser-local speeds backed by high-compute redundant server nodes.",
      version: "1.0.0"
    },
    servers: [
      {
        url: "https://mysaastools.vercel.app",
        description: "Production Server"
      }
    ],
    security: [
      {
        bearerAuth: []
      }
    ],
    paths: {
      "/api/v1/format": {
        post: {
          summary: "Format Raw Document or JSON Payload",
          description: "Formats unformatted text into beautifully styled Markdown, HTML, and plain text, or parses and corrects JSON structures based on chosen action flags.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    text: {
                      type: "string",
                      description: "The raw content to format (unformatted document text or JSON payload string)."
                    },
                    style: {
                      type: "string",
                      enum: ["modern", "academic", "minimalist"],
                      default: "modern",
                      description: "The visual style layout template to apply (ignored if tool is 'json')."
                    },
                    customHeader: {
                      type: "string",
                      description: "Optional custom header text to inject into the HTML layout."
                    },
                    customFooter: {
                      type: "string",
                      description: "Optional custom footer text to inject into the HTML layout."
                    },
                    tool: {
                      type: "string",
                      enum: ["ai-formatter", "json"],
                      default: "ai-formatter",
                      description: "Specifies target processing engine. Use 'json' to parse, repair, and minify JSON payloads."
                    },
                    action: {
                      type: "string",
                      enum: ["Format", "Auto-Repair", "Minify"],
                      default: "Format",
                      description: "JSON action mode (ignored unless tool is set to 'json')."
                    }
                  },
                  required: ["text"]
                }
              }
            }
          },
          responses: {
            "200": {
              description: "Format operation succeeded",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", example: "success" },
                      data: {
                        type: "object",
                        properties: {
                          formatted: { type: "string", description: "The formatted output (HTML for documents, JSON string for JSON tool)." },
                          html: { type: "string", description: "The styled HTML document representation." },
                          markdown: { type: "string", description: "The raw formatted Markdown." },
                          text: { type: "string", description: "Stripped, clean plain text output." },
                          status: { type: "string", description: "Specific JSON validation status ('success', 'repaired', 'already_valid')." },
                          error_details: { type: "string", description: "JSON repair description details." },
                          metadata: {
                            type: "object",
                            properties: {
                              chars_processed: { type: "integer" },
                              words_count: { type: "integer" },
                              tier: { type: "string" },
                              api_requests_today: { type: "integer" },
                              timestamp: { type: "string", format: "date-time" }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            "400": {
              description: "Syntax or payload formatting validation error",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", example: "error" },
                      message: { type: "string" },
                      data: { type: "object" }
                    }
                  }
                }
              }
            },
            "401": {
              description: "Unauthorized API key token missing or invalid"
            },
            "429": {
              description: "Rate limit quota volume exhausted"
            }
          }
        }
      },
      "/api/v1/convert-image": {
        post: {
          summary: "Transcode HEIC Image",
          description: "Batch transcodes Apple HEIC/HEIF images into compressed JPG or PNG files. Preserves EXIF metadata structures.",
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  properties: {
                    file: {
                      type: "string",
                      format: "binary",
                      description: "The .heic or .heif image file to convert."
                    },
                    format: {
                      type: "string",
                      enum: ["jpg", "png"],
                      default: "jpg",
                      description: "The desired output image format."
                    },
                    quality: {
                      type: "number",
                      minimum: 0.01,
                      maximum: 1.0,
                      default: 0.95,
                      description: "Compression scale factor."
                    }
                  },
                  required: ["file"]
                }
              },
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    image: {
                      type: "string",
                      description: "Base64-encoded HEIC/HEIF image data string (data URI format supported)."
                    },
                    format: {
                      type: "string",
                      enum: ["jpg", "png"],
                      default: "jpg"
                    },
                    quality: {
                      type: "number",
                      default: 0.95
                    }
                  },
                  required: ["image"]
                }
              }
            }
          },
          responses: {
            "200": {
              description: "Image successfully converted",
              content: {
                "image/jpeg": {
                  schema: {
                    type: "string",
                    format: "binary"
                  }
                },
                "image/png": {
                  schema: {
                    type: "string",
                    format: "binary"
                  }
                },
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", example: "success" },
                      data: {
                        type: "object",
                        properties: {
                          image: { type: "string", description: "Base64 JPG/PNG data URI." },
                          format: { type: "string" },
                          sizeBytes: { type: "integer" },
                          metadata: {
                            type: "object",
                            properties: {
                              api_requests_today: { type: "integer" },
                              timestamp: { type: "string", format: "date-time" }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            "400": {
              description: "Invalid image payload or parameters"
            },
            "401": {
              description: "Missing or invalid Authorization header"
            },
            "429": {
              description: "Daily image limit quota exhausted"
            }
          }
        }
      },
      "/api/v1/export-pdf": {
        post: {
          summary: "Compile HTML / Markdown to PDF",
          description: "Renders stylized print-ready, multi-page vector PDF documents directly from HTML layout strings or raw text.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    html: {
                      type: "string",
                      description: "The styled HTML layout string to render as pages."
                    },
                    filename: {
                      type: "string",
                      default: "document.pdf",
                      description: "The download filename returned in headers."
                    },
                    customHeader: {
                      type: "string",
                      description: "Optional custom header text printed at the top of every page."
                    },
                    customFooter: {
                      type: "string",
                      description: "Optional custom footer text printed at the bottom of every page."
                    }
                  },
                  required: ["html"]
                }
              }
            }
          },
          responses: {
            "200": {
              description: "Vector PDF successfully generated",
              content: {
                "application/pdf": {
                  schema: {
                    type: "string",
                    format: "binary"
                  }
                }
              }
            },
            "400": {
              description: "Missing HTML content payload"
            },
            "401": {
              description: "Missing or invalid API key credentials"
            },
            "429": {
              description: "PDF quota limit exhausted"
            },
            "502": {
              description: "Hugging Face PDF server compile nodes offline"
            }
          }
        }
      }
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          description: "Developer API Bearer key generated inside the user dashboard `/account`."
        }
      }
    }
  };

  return new Response(JSON.stringify(spec, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400'
    }
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
